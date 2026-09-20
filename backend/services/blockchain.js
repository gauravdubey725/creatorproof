const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

// Inline ABI fallback in case the artifact JSON cannot be read at runtime
const FALLBACK_ABI = [
  "function registerContent(string calldata contentId, string calldata title, string calldata sha256Hash) external returns (bool)",
  "function verifyContent(string calldata contentId, string calldata sha256Hash) external view returns (bool verified)",
  "function getContent(string calldata contentId) external view returns (string memory id, string memory title, string memory sha256Hash, address owner, uint256 timestamp, uint256 blockNumber)",
  "function getContentByHash(string calldata sha256Hash) external view returns (string memory contentId)",
  "event ContentRegistered(string indexed contentId, string indexed sha256Hash, address indexed owner, string title, uint256 timestamp, uint256 blockNumber)"
];

let provider = null;
let wallet = null;
let contract = null;
let isConfigured = false;
let hasBytecode = null;

async function checkContractBytecode() {
  if (!provider || !contract) return false;
  if (hasBytecode !== null) return hasBytecode;
  try {
    const target = contract.target || contract.address;
    const code = await provider.getCode(target);
    hasBytecode = (code && code !== '0x' && code !== '0x0');
    if (!hasBytecode) {
      console.warn(`[Blockchain] Contract bytecode not deployed at ${target} on connected network. On-chain calls disabled.`);
    }
    return hasBytecode;
  } catch (err) {
    console.warn('[Blockchain] Bytecode check error:', err.message);
    hasBytecode = false;
    return false;
  }
}

function initializeBlockchain() {
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    hasBytecode = null;

    if (!rpcUrl || !contractAddress || contractAddress.startsWith('0x00000000000000000000')) {
      console.warn('[Blockchain] Smart contract not configured. On-chain operations will run in local-ledger mode.');
      isConfigured = false;
      return;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);

    // Attempt to load ABI from the artifact
    let abi = FALLBACK_ABI;
    const artifactPath = path.resolve(__dirname, '../../artifacts/contracts/CreatorProofRegistry.sol/CreatorProofRegistry.json');
    if (fs.existsSync(artifactPath)) {
      try {
        const raw = fs.readFileSync(artifactPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.abi && Array.isArray(parsed.abi)) {
          abi = parsed.abi;
        }
      } catch (err) {
        console.warn('[Blockchain] Could not parse artifact JSON, using fallback ABI:', err.message);
      }
    }

    if (privateKey && privateKey.length >= 64 && !privateKey.includes('your-wallet-private-key')) {
      const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      wallet = new ethers.Wallet(cleanKey, provider);
      contract = new ethers.Contract(contractAddress, abi, wallet);
      isConfigured = true;
      console.log(`[Blockchain] Connected to contract at ${contractAddress} with wallet ${wallet.address}`);
    } else {
      // Read-only contract connection
      contract = new ethers.Contract(contractAddress, abi, provider);
      isConfigured = true;
      console.log(`[Blockchain] Connected in read-only mode to contract at ${contractAddress}`);
    }

    // Trigger non-blocking bytecode check
    checkContractBytecode().catch(() => {});
  } catch (error) {
    console.warn('[Blockchain] Initialization error:', error.message);
    isConfigured = false;
  }
}

// Initial setup
initializeBlockchain();

/**
 * Checks if the blockchain service is fully operational with a signer
 */
function isReady() {
  return isConfigured && contract !== null && hasBytecode !== false;
}

/**
 * Registers content on the blockchain registry contract.
 * @param {string} contentId
 * @param {string} title
 * @param {string} sha256Hash
 * @returns {Promise<{ success: boolean, txHash?: string, blockNumber?: number, error?: string, reason?: string }>}
 */
async function registerContent(contentId, title, sha256Hash) {
  if (!isReady() || !wallet) {
    return {
      success: false,
      reason: 'Blockchain signer not configured or contract address missing.'
    };
  }

  const codeExists = await checkContractBytecode();
  if (!codeExists) {
    return {
      success: false,
      reason: 'Contract not deployed on connected network.'
    };
  }

  try {
    const tx = await contract.registerContent(contentId, title, sha256Hash);
    console.log(`[Blockchain] RegisterContent tx sent: ${tx.hash}`);

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    console.log(`[Blockchain] Tx confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error(`[Blockchain] registerContent execution error:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifies content on the blockchain registry contract.
 * @param {string} contentId
 * @param {string} sha256Hash
 * @returns {Promise<{ success: boolean, verified: boolean, error?: string, reason?: string }>}
 */
async function verifyContent(contentId, sha256Hash) {
  if (!isConfigured || !contract) {
    return {
      success: false,
      verified: false,
      reason: 'Blockchain contract not configured.'
    };
  }

  const codeExists = await checkContractBytecode();
  if (!codeExists) {
    return {
      success: false,
      verified: false,
      reason: 'Contract not deployed on connected network.'
    };
  }

  try {
    const verified = await contract.verifyContent(contentId, sha256Hash);
    return {
      success: true,
      verified: Boolean(verified)
    };
  } catch (error) {
    console.error(`[Blockchain] verifyContent error:`, error.message);
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
}

/**
 * Retrieves content record details from the blockchain registry.
 * @param {string} contentId
 * @returns {Promise<{ success: boolean, data?: object, error?: string, reason?: string }>}
 */
async function getContent(contentId) {
  if (!isConfigured || !contract) {
    return {
      success: false,
      reason: 'Blockchain contract not configured.'
    };
  }

  const codeExists = await checkContractBytecode();
  if (!codeExists) {
    return {
      success: false,
      reason: 'Contract not deployed on connected network.'
    };
  }

  try {
    const result = await contract.getContent(contentId);
    return {
      success: true,
      data: {
        id: result[0] || result.id,
        title: result[1] || result.title,
        sha256Hash: result[2] || result.sha256Hash,
        owner: result[3] || result.owner,
        timestamp: Number(result[4] || result.timestamp),
        blockNumber: Number(result[5] || result.blockNumber)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  isReady,
  registerContent,
  verifyContent,
  getContent,
  initializeBlockchain,
  checkContractBytecode
};
