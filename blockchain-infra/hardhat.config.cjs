require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
const networks = {};
if (process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
  };
}

module.exports = {
  solidity: "0.8.28",
  networks,
};
