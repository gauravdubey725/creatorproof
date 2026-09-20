const path = require("path");

// Load .env from backend and root
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("@nomicfoundation/hardhat-toolbox");

let SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
if (!SEPOLIA_RPC_URL || SEPOLIA_RPC_URL.includes("your-api-key") || SEPOLIA_RPC_URL.includes("your_infura_alchemy_url")) {
  SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
}

let PRIVATE_KEY = process.env.PRIVATE_KEY || "";
if (PRIVATE_KEY && !PRIVATE_KEY.startsWith("0x") && PRIVATE_KEY.length === 64) {
  PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

const accounts = (PRIVATE_KEY && PRIVATE_KEY.length === 66 && !PRIVATE_KEY.includes("your-wallet-private-key") && !PRIVATE_KEY.includes("your_wallet_private_key"))
  ? [PRIVATE_KEY]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: accounts.length > 0 ? accounts : undefined
    }
  },
  paths: {
    sources: path.resolve(__dirname, "../contracts"),
    tests: path.resolve(__dirname, "../test"),
    cache: path.resolve(__dirname, "../cache"),
    artifacts: path.resolve(__dirname, "../artifacts")
  }
};
