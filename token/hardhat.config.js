require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");

if (process.env.NODE_ENV != 'production') {
  require("hardhat-erc1820");
}

if (process.env.REPORT_GAS) {
  require("hardhat-gas-reporter");
}

const fs = require('fs');
const key = fs.readFileSync(".secret").toString().trim();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "XXXXXXXXXXXXXX"
      },
    },
    goerli: {
      url: `XXXXXXXXXXXXXXXXXX`,
      accounts: [key],
      network_id: 5
    },
    mainnet: {
      url: `XXXXXXXXXXXXXXXXXX`,
      accounts: [key],
      network_id: 1
    },
    mumbai: {
      url: `XXXXXXXXXXXXXXXXXX`,
      accounts: [key],
      network_id: 80001
    },
    polygon: {
      url: `XXXXXXXXXXXXXXXXXX`,
      accounts: [key],
      network_id: 137
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000
          }
        }
      },
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000
          }
        }
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000
          }
        }
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.5.12",
      },
      {
        version: "0.5.2",
      },
      {
        version: "0.4.24",
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000
      }
    }
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 60,
    showTimeSpent: true,
  },
};
 