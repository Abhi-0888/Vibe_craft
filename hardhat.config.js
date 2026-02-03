import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";

const config = {
  solidity: "0.8.20",
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "hh-cache",
    artifacts: "hh-artifacts",
  },
  networks: {
    orchard: {
      type: "http",
      url: "https://orchard.rpc.quai.network/cyprus1",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
