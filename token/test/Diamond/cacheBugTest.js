/* global ethers contract before it */
/* eslint-disable prefer-const */


const { FacetCutAction } = require('../../libraries/diamond.js')

const { assert } = require('chai')

// The diamond example comes with 8 function selectors
// [cut, loupe, loupe, loupe, loupe, erc165, transferOwnership, owner]
// This bug manifests if you delete something from the final
// selector slot array, so we'll fill up a new slot with
// things, and have a fresh row to work with.
contract('MNFT : Diamond cache bug test', async () => {
  let diamondLoupeFacet
  let test1Facet
  const ownerSel = '0x8da5cb5b'

  const sel0 = '0x19e3b533' // fills up slot 1
  const sel1 = '0x0716c2ae' // fills up slot 1
  const sel2 = '0x11046047' // fills up slot 1
  const sel3 = '0xcf3bbe18' // fills up slot 1
  const sel4 = '0x24c1d5a7' // fills up slot 1
  const sel5 = '0xcbb835f6' // fills up slot 1
  const sel6 = '0xcbb835f7' // fills up slot 1
  const sel7 = '0xcbb835f8' // fills up slot 2
  const sel8 = '0xcbb835f9' // fills up slot 2
  const sel9 = '0xcbb835fa' // fills up slot 2
  const sel10 = '0xcbb835fb' // fills up slot 2

  before(async function () {
    let tx
    let receipt

    let selectors = [
      sel0,
      sel1,
      sel2,
      sel3,
      sel4,
      sel5,
      sel6,
      sel7,
      sel8,
      sel9,
      sel10
    ]

    let MNFT = artifacts.require('MNFT');
    this.diamond = await MNFT.deployed();
    let diamondCutFacet = artifacts.require('DiamondCutFacet');
    diamondCutFacet = await diamondCutFacet.at(this.diamond.address)
    diamondLoupeFacet = artifacts.require('DiamondLoupeFacet');
    diamondLoupeFacet = await diamondLoupeFacet.at(this.diamond.address)
    const Test1Facet = artifacts.require('Test1Facet')
    test1Facet = await Test1Facet.new()

    // add functions
    tx = await diamondCutFacet.diamondCut([
      {
        facetAddress: test1Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }
    ], "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }

    // Remove function selectors
    // Function selector for the owner function in slot 0
    selectors = [
      ownerSel, // owner selector
      sel5,
      sel10
    ]
    tx = await diamondCutFacet.diamondCut([
      {
        facetAddress: "0x0000000000000000000000000000000000000000",
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }
    ], "0x0000000000000000000000000000000000000000", '0x', { gas: 800000 })
    if (!tx.receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
  })

  it('should not exhibit the cache bug', async () => {
    // Get the test1Facet's registered functions
    let selectors = await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address)

    // Check individual correctness
    assert.isTrue(selectors.includes(sel0), 'Does not contain sel0')
    assert.isTrue(selectors.includes(sel1), 'Does not contain sel1')
    assert.isTrue(selectors.includes(sel2), 'Does not contain sel2')
    assert.isTrue(selectors.includes(sel3), 'Does not contain sel3')
    assert.isTrue(selectors.includes(sel4), 'Does not contain sel4')
    assert.isTrue(selectors.includes(sel6), 'Does not contain sel6')
    assert.isTrue(selectors.includes(sel7), 'Does not contain sel7')
    assert.isTrue(selectors.includes(sel8), 'Does not contain sel8')
    assert.isTrue(selectors.includes(sel9), 'Does not contain sel9')

    assert.isFalse(selectors.includes(ownerSel), 'Contains ownerSel')
    assert.isFalse(selectors.includes(sel10), 'Contains sel10')
    assert.isFalse(selectors.includes(sel5), 'Contains sel5')
  })
})
