const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners(); // ← yeh line zaroori hai
  
  const Contract = await hre.ethers.getContractFactory("CampaignVerification");
  const contract = await Contract.deploy();
  
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});