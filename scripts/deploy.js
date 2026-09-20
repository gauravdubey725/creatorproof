import hre from "hardhat";

async function main() {
  console.log("----------------------------------------------------");
  console.log("Starting CreatorProofRegistry deployment...");
  console.log("Target Network:", hre.network.name);

  const signers = await hre.ethers.getSigners();
  if (signers && signers.length > 0) {
    const deployer = signers[0];
    console.log("Deployer Wallet Address:", deployer.address);

    try {
      const balance = await hre.ethers.provider.getBalance(deployer.address);
      const formattedBalance = hre.ethers.formatEther ? hre.ethers.formatEther(balance) : hre.ethers.utils.formatEther(balance);
      console.log("Deployer Account Balance:", formattedBalance, "ETH");

      if (balance === 0n || balance == 0) {
        console.warn("\n⚠️  WARNING: Account balance is 0 ETH! Deployment on Sepolia will fail due to lack of gas.");
        console.warn("👉 Please obtain free Sepolia testnet ETH from a faucet such as:");
        console.warn("   - https://sepoliafaucet.com");
        console.warn("   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
        console.warn("   - https://www.alchemy.com/faucets/ethereum-sepolia\n");
      }
    } catch (balErr) {
      console.warn("Could not retrieve account balance:", balErr.message);
    }
  } else {
    console.error("\n❌ DEPLOYMENT HALTED: No valid signer account configured.");
    console.error("👉 Please add your wallet private key to .env:");
    console.error("   PRIVATE_KEY=your_64_character_wallet_private_key_without_0x");
    console.error("👉 Also ensure that account is funded with Sepolia testnet ETH from a faucet (e.g., https://sepoliafaucet.com or https://cloud.google.com/application/web3/faucet/ethereum/sepolia)\n");
    process.exit(1);
  }

  // Retrieve contract factory
  console.log("Compiling & loading CreatorProofRegistry contract factory...");
  const CreatorProofRegistry = await hre.ethers.getContractFactory("CreatorProofRegistry");

  // Broadcast deployment transaction
  console.log("Broadcasting deployment transaction to the network...");
  const registry = await CreatorProofRegistry.deploy();

  // Wait for deployment confirmation (compatible with both ethers v5 & v6)
  if (typeof registry.waitForDeployment === "function") {
    await registry.waitForDeployment();
  } else if (typeof registry.deployed === "function") {
    await registry.deployed();
  }

  const contractAddress = typeof registry.getAddress === "function" 
    ? await registry.getAddress() 
    : registry.address;

  const txHash = registry.deploymentTransaction 
    ? registry.deploymentTransaction()?.hash 
    : registry.deployTransaction?.hash;

  console.log("====================================================");
  console.log("🎉 CreatorProofRegistry deployed successfully!");
  console.log("Contract Address:", contractAddress);
  if (txHash) {
    console.log("Deployment Transaction:", txHash);
    if (hre.network.name === "sepolia") {
      console.log(`Sepolia Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    }
  }
  console.log("====================================================");
  console.log("\n👉 ACTION REQUIRED: Add or update CONTRACT_ADDRESS in your .env files:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed with error:");
    console.error(error);
    process.exit(1);
  });
