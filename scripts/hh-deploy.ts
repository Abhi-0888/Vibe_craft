import "dotenv/config";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY not set in .env");
  }
  const rpc = "https://orchard.rpc.quai.network/cyprus1";
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  console.log("Deploying CardGame from:", wallet.address);

  const artifactPath = path.resolve("hh-artifacts/contracts/CardGame.sol/CardGame.json");
  const artifactRaw = fs.readFileSync(artifactPath, "utf-8");
  const artifact = JSON.parse(artifactRaw);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CardGame deployed at:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
