require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "hh-cache",
    artifacts: "hh-artifacts",
  },
  networks: {
    cyprus1: {
      url: "https://rpc.cyprus1.colosseum.quaiscan.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    cyprus2: {
      url: "https://rpc.cyprus2.colosseum.quaiscan.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    cyprus3: {
      url: "https://rpc.cyprus3.colosseum.quaiscan.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
