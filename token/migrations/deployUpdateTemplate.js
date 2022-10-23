// /* global ethers */
// /* eslint prefer-const: "off" */

// const { getSelectors, FacetCutAction } = require('../libraries/diamond.js');

// async function deployUpdate () {
//   const accounts = await ethers.getSigners();
//   const contractOwner = accounts[0];

//   const MNFTAddress = {
//     goerli: () => "0xfC8ffFD573e7a8e33f4158710F2dF05763103Ed0",
//     mumbai: () => "0xfC8ffFD573e7a8e33f4158710F2dF05763103Ed0",
//     live: () => "0x349b15326b48B261a7f600fb2fF906E49fefF8e9",
//     polygon: () => "0x349b15326b48B261a7f600fb2fF906E49fefF8e9",
//     development: () => {
//         // const MNFT = artifacts.require('MNFT');
//         // return MNFT.address;
//     }
// }[network](); 


//   // deploy DiamondInit
//   // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
//   // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
//   const DiamondInit = await ethers.getContractFactory('DiamondInit');
//   const diamondInit = await DiamondInit.deploy();
//   await diamondInit.deployed();
//   console.log('DiamondInit deployed:', diamondInit.address);

//   // deploy facets
//   console.log('');
//   console.log('Deploying facets');
//   const FacetNames = [
//     'MNFTSpecialSaleFacet'
//   ];
  
//   const cut = [];
//   for (const FacetName of FacetNames) {
//     const Facet = await ethers.getContractFactory(FacetName);
//     const facet = await Facet.deploy();
//     await facet.deployed();
//     console.log(`${FacetName} deployed: ${facet.address}`);
//     cut.push({
//       facetAddress: facet.address,
//       action: FacetCutAction.Replace,
//       functionSelectors: [getSelector('presale')]
//     });
//   }

//   // upgrade diamond with facets
//   console.log('');
//   console.log('Diamond Cut:', cut);
//   const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
//   // call to init function
//   let functionCall = diamondInit.interface.encodeFunctionData('init');
//   let tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
//   console.log('Diamond cut tx: ', tx.hash);
//   let receipt = await tx.wait();
//   if (!receipt.status) {
//     throw Error(`Diamond upgrade failed: ${tx.hash}`);
//   }
//   console.log('Completed diamond cut');
//   return diamond.address;
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// if (require.main === module) {
//   deployUpdate()
//     .then(() => process.exit(0))
//     .catch(error => {
//       console.error(error);
//       process.exit(1);
//     });
// }

// exports.deployDiamond = deployDiamond;
