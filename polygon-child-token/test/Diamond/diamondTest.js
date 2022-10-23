/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../../libraries/diamond-truffle.js')

const { assert } = require('chai')

contract('MNFT : Diamond', async function () {
  const MNFT = artifacts.require('MNFT');
  let MNFTInstance;
  let DiamondCutFacet;
  let DiamondLoupeFacet;
  let OwnershipFacet;
  let tx;
  let result;
  const addresses = [];

  before(async function () {
    MNFTInstance = await MNFT.deployed();
    console.log(MNFTInstance.address);
    DiamondCutFacet = artifacts.require('DiamondCutFacet');
    DiamondCutFacet = await DiamondCutFacet.at(MNFTInstance.address);
    DiamondLoupeFacet = artifacts.require('DiamondLoupeFacet');
    DiamondLoupeFacet = await DiamondLoupeFacet.at(MNFTInstance.address);
    OwnershipFacet = artifacts.require('OwnershipFacet');
    OwnershipFacet = await OwnershipFacet.at(MNFTInstance.address);
  })

  it('should have 7 facets -- call to facetAddresses function', async () => {
    for (const address of await DiamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 7)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(DiamondCutFacet)
    result = await DiamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(DiamondLoupeFacet)
    result = await DiamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(OwnershipFacet)
    result = await DiamondLoupeFacet.facetFunctionSelectors(addresses[2])
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await DiamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await DiamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await DiamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2],
      await DiamondLoupeFacet.facetAddress('0xf2fde38b')
    )
  })

  it('should add test1 functions', async () => {
    let Test1Facet = artifacts.require('Test1Facet')
    Test1Facet = await Test1Facet.new();
    addresses.push(Test1Facet.address)
    const selectors = getSelectors(Test1Facet).remove(['supportsInterface(bytes4)'])
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: Test1Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(Test1Facet.address)
    assert.sameMembers(result, selectors)
  })

  it('should test function call', async () => {
    let Test1Facet = artifacts.require('Test1Facet')
    Test1Facet = await Test1Facet.at(MNFTInstance.address)
    await Test1Facet.test1Func10()
  })

  it('should replace supportsInterface function', async () => {
    const Test1Facet = artifacts.require('Test1Facet')
    const selectors = getSelectors(Test1Facet).get(['supportsInterface(bytes4)'])
    const testFacetAddress = addresses[addresses.length - 1];
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: testFacetAddress,
        action: FacetCutAction.Replace,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(testFacetAddress)
    assert.sameMembers(result, getSelectors(Test1Facet))
  })

  it('should add test2 functions', async () => {
    let Test2Facet = artifacts.require('Test2Facet')
    Test2Facet = await Test2Facet.new();
    addresses.push(Test2Facet.address)
    const selectors = getSelectors(Test2Facet)
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: Test2Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(Test2Facet.address)
    assert.sameMembers(result, selectors)
  })

  it('should remove some test2 functions', async () => {
    let Test2Facet = artifacts.require('Test2Facet');
    Test2Facet = await Test2Facet.at(MNFTInstance.address)
    const functionsToKeep = ['test2Func1()', 'test2Func5()', 'test2Func6()', 'test2Func19()', 'test2Func20()']
    const selectors = getSelectors(Test2Facet).remove(functionsToKeep)
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: "0x0000000000000000000000000000000000000000",
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(addresses[addresses.length - 1])
    assert.sameMembers(result, getSelectors(Test2Facet).get(functionsToKeep))
  })

  it('should remove some test1 functions', async () => {
    let Test1Facet = artifacts.require('Test1Facet');
    Test1Facet = await Test1Facet.at(MNFTInstance.address)
    const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()']
    const selectors = getSelectors(Test1Facet).remove(functionsToKeep)
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: "0x0000000000000000000000000000000000000000",
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(addresses[addresses.length - 2])
    assert.sameMembers(result, getSelectors(Test1Facet).get(functionsToKeep))
  })

  it('remove all functions and facets accept \'diamondCut\' and \'facets\'', async () => {
    let selectors = []
    let facets = await DiamondLoupeFacet.facets()
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors)
    }
      selectors = removeSelectors(selectors, ['facets()', 'diamondCut((address,uint8,bytes4[])[],address,bytes)'])
    tx = await DiamondCutFacet.diamondCut(
      [{
        facetAddress: "0x0000000000000000000000000000000000000000",
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    facets = await DiamondLoupeFacet.facets()
    assert.equal(facets.length, 2)
    assert.equal(facets[0][0], addresses[0])
    assert.sameMembers(facets[0][1], ['0x1f931c1c'])
    assert.equal(facets[1][0], addresses[1])
    assert.sameMembers(facets[1][1], ['0x7a0ed627'])
    addresses.splice(3, 4);
  })

  it('add most functions and facets', async () => {
    const diamondLoupeFacetSelectors = getSelectors(DiamondLoupeFacet).remove(['supportsInterface(bytes4)'])
    const Test1Facet = artifacts.require('Test1Facet')
    const Test2Facet = artifacts.require('Test2Facet')
    // Any number of functions from any number of facets can be added/replaced/removed in a
    // single transaction
    const cut = [
      {
        facetAddress: addresses[1],
        action: FacetCutAction.Add,
        functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
      },
      {
        facetAddress: addresses[2],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(OwnershipFacet)
      },
      {
        facetAddress: addresses[addresses.length - 2],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(Test1Facet)
      },
      {
        facetAddress: addresses[addresses.length - 1],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(Test2Facet)
      }
    ]
    tx = await DiamondCutFacet.diamondCut(cut, "0x0000000000000000000000000000000000000000", '0x')
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    const facets = await DiamondLoupeFacet.facets()
    const facetAddresses = await DiamondLoupeFacet.facetAddresses()
    assert.equal(facetAddresses.length, 5)
    assert.equal(facets.length, 5)
    assert.sameMembers(facetAddresses, addresses)
    assert.equal(facets[0][0], facetAddresses[0], 'first facet')
    assert.equal(facets[1][0], facetAddresses[1], 'second facet')
    assert.equal(facets[2][0], facetAddresses[2], 'third facet')
    assert.equal(facets[addresses.length - 2][0], facetAddresses[addresses.length - 2], 'fourth facet')
    assert.equal(facets[addresses.length - 1][0], facetAddresses[addresses.length - 1], 'fifth facet')
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[0], facets)][1], getSelectors(DiamondCutFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[1], facets)][1], diamondLoupeFacetSelectors)
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[2], facets)][1], getSelectors(OwnershipFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(Test1Facet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[4], facets)][1], getSelectors(Test2Facet))
  })
})
