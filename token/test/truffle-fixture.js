const hre = require('hardhat');
const { deployDiamond } = require('../migrations/deployMNFT.js');
const { deployUpdate: deployERC20TransferUpdate } = require('../migrations/deployERC20TransferUpdate.js');
const { deployUpdate: deployClaimUpdate } = require('../migrations/deployClaimUpdate.js');
const { deployUpdate: deployPublicSale } = require('../migrations/deployPublicSale.js');
const MNFT = artifacts.require("MNFT");

module.exports = async () => {
    const diamond = await deployDiamond();
    await deployERC20TransferUpdate(diamond.address);
    await deployClaimUpdate(diamond.address);
    await deployPublicSale(diamond.address);
    MNFT.setAsDeployed(diamond);
};