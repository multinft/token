const hre = require('hardhat');
const { deployDiamond } = require('../migrations/deployMNFTChild.js');
const MNFT = artifacts.require("MNFT");

module.exports = async () => {
    const diamond = await deployDiamond();
    MNFT.setAsDeployed(diamond);
};
