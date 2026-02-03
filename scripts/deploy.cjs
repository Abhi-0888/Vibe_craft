require("dotenv").config();
const fs = require("fs");
const path = require("path");
const quais = require("quais");

async function main() {
  const pk = process.env.PRIV_KEY || process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("Set PRIV_KEY in .env: PRIV_KEY=\"your_private_key_here\"");
  }

  const artifactPath = path.join(__dirname, "..", "hh-artifacts", "contracts", "CardGame.sol", "CardGame.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract not compiled. Run: npx hardhat compile");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const provider = new quais.JsonRpcProvider("https://orchard.rpc.quai.network/cyprus1");
  const wallet = new quais.Wallet(pk, provider);

  console.log("Deploying CardGame from:", wallet.address);
  const factory = new quais.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  factory.setIPFSHash("QmYwAPJzv5CZsnAzt8auVTLsYjN2DGW5ZChx7YsiqX3K3C");
  // Constructor expects a treasury address; pass deployer address (ignored in contract logic but required by ABI)
  const contract = await factory.deploy(wallet.address);
  console.log("Transaction:", contract.deploymentTransaction().hash);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("CardGame deployed at:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
