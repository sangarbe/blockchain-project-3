const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraKey = process.env.INFURA_PROJECT_ID;
const mnemonic = process.env.ETH_MNEMONIC;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
      network_id: 4,
    }
  },
  compilers: {
    solc: {
      version: "pragma",
      parser: "solcjs"
    }
  }
};