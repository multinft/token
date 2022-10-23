/* global ethers */
/* eslint prefer-const: "off" */

const { getSelector, getSelectors, FacetCutAction } = require('../libraries/diamond.js');
const hre = require('hardhat');

async function deployUpdate (diamondAddress = null) {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  const MNFTAddress = {
    goerli: () => "0xfC8ffFD573e7a8e33f4158710F2dF05763103Ed0",
    mumbai: () => "0xfC8ffFD573e7a8e33f4158710F2dF05763103Ed0",
    mainnet: () => "0x349b15326b48B261a7f600fb2fF906E49fefF8e9",
    polygon: () => "0x349b15326b48B261a7f600fb2fF906E49fefF8e9",
    hardhat: () => {
        return diamondAddress;
    }
}[hre.network.name](); 

  // deploy facets
  console.log('');
  console.log('Deploying facets');
  
  const cut = [];
   const Facet = await ethers.getContractFactory('RentVenueFacet');
   const facet = await Facet.deploy();
   let deployment = await facet.deployed();
   console.log(deployment);
    console.log(`RentVenueFacet deployed: ${facet.address}`);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    });
  // upgrade diamond with facets
  console.log('');
  console.log('Diamond Cut:', cut);
  const diamondCut = await ethers.getContractAt('IDiamondCut', MNFTAddress);
  // call to init function
  let tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x');
  console.log('Diamond cut tx: ', tx.hash);
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log(tx);
  console.log('Completed diamond cut');
  return diamondAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployUpdate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployUpdate = deployUpdate;
