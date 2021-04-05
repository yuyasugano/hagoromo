require('dotenv').config();
const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  compilers: {
    solc: {
      version: ">=0.6.2 <0.8.0",
    }
  },
  networks: {
    develop: {
      host: process.env.SERVER_IP,
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        process.env.INFURA_URL
      ),
      network_id: 4,
    }
  }
};
