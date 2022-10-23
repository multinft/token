// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { LibDiamond } from "../libraries/LibDiamond.sol";

import  { MNFTERC777Facet, ERC777Storage } from './MNFTERC777Facet.sol';

struct ERC777PolygonStorage {
    address _childChainManagerProxy;
}

contract MNFTERC777ChildFacet is MNFTERC777Facet {

    function getERC777PolygonStorage() internal pure returns(ERC777PolygonStorage storage eps) {
        // eps.slot = keccak256("mnft.erc777.polygon.storage")
        assembly {
            eps.slot := 0x25d792370e7a6b9d71730ced867cce298e265ebaabc84a08710b361b456fa917
        }
    }

    function updateChildChainManager(address newChildChainManagerProxy) external {
        require(newChildChainManagerProxy != address(0), "Bad ChildChainManagerProxy address");
        LibDiamond.enforceIsContractOwner();

        (getERC777PolygonStorage())._childChainManagerProxy = newChildChainManagerProxy;
    }

    function deposit(address user, bytes calldata depositData) external {
        require(msg.sender == (getERC777PolygonStorage())._childChainManagerProxy, "You're not allowed to deposit");

        uint256 amount = abi.decode(depositData, (uint256));

        ERC777Storage storage es = getERC777Storage();
        es._totalSupply += amount;
        es._balances[user] += amount;
        
        emit Transfer(address(0), user, amount);
    }

    function withdraw(uint256 amount) external {
        ERC777Storage storage es = getERC777Storage();
        
        require(amount <= es._balances[msg.sender], "Burn amount exceeds balance");

        es._balances[msg.sender] -= amount;
        es._totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }

}