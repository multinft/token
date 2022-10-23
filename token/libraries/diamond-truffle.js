/* global ethers */

const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

// get function selectors from ABI
function getSelectors (contract) {
  const selectors = contract.abi.reduce((acc, func) => {
    if (func.name !== 'init(bytes)' && func.type == 'function') {
      acc.push(func.signature || web3.eth.abi.encodeFunctionSignature(func));
    }
    return acc
  }, []);
  selectors.contract = contract;
  selectors.remove = remove;
  selectors.get = get;
  return selectors;
}

//get function selector from function signature
function getSelector (func) {
  return web3.eth.abi.encodeFunctionSignature(func);
}

// // used with getSelectors to remove selectors from an array of selectors
// // functionNames argument is an array of function signatures
function remove (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === web3.eth.abi.encodeFunctionSignature(functionName)) {
        return false
      }
    }
    return true
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  return selectors
}

// // used with getSelectors to get selectors from an array of selectors
// // functionNames argument is an array of function signatures
function get (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === web3.eth.abi.encodeFunctionSignature(functionName)) {
        return true
      }
    }
    return false
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  return selectors
}

// // remove selectors using an array of signatures
function removeSelectors (selectors, signatures) {
  // const iface = new ethers.utils.Interface(signatures.map(v => 'function ' + v))
  const removeSelectors = signatures.map(v => web3.eth.abi.encodeFunctionSignature(v))
  selectors = selectors.filter(v => !removeSelectors.includes(v))
  return selectors
}

// // find a particular address position in the return value of diamondLoupeFacet.facets()
function findAddressPositionInFacets (facetAddress, facets) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

exports.getSelectors = getSelectors;
exports.getSelector = getSelector;
exports.FacetCutAction = FacetCutAction;
exports.remove = remove;
exports.removeSelectors = removeSelectors;
exports.findAddressPositionInFacets = findAddressPositionInFacets;
