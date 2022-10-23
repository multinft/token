// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "../libraries/LibDiamond.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IERC173 } from "../interfaces/IERC173.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { IERC1820Registry } from "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";
import { StakingStorage } from "../facets/MNFTStakingFacet.sol";


// It is expected that this contract is customized if you want to deploy your diamond
// with data from a deployment script. Use the init function to initialize state variables
// of your diamond. Add parameters to the init funciton if you need to.

contract DiamondInit {    

    // You can add parameters to this function in order to pass in 
    // data to set your own state variables
    function init(
        string calldata name_,
        string calldata symbol_,
        uint256 initialSupply_,
        address[] calldata defaultOperators_,
        address stakingAccount
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        ERC777Storage storage es;
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }

        StakingStorage storage ss;
        assembly {
            ss.slot := 0x9d94a552b79e041387c81ff6ef283d25141878a49159d618301326183d77fd04
        }

        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;

        es._name = name_;
        es._symbol = symbol_;
        
        es._defaultOperatorsArray = defaultOperators_;
        for (uint256 i = 0; i < defaultOperators_.length; i++) {
            es._defaultOperators[defaultOperators_[i]] = true;
        }

        // register interfaces
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24)
        .setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24)
        .setInterfaceImplementer(address(this), keccak256("ERC20Token"), address(this));

        (bool success, ) = address(this).delegatecall(abi.encodeWithSignature("mint(address,uint256,bytes,bytes,bool)", msg.sender, initialSupply_, "", "", false));
        require(success, "Mint failed");

        ss._stakingAccount = stakingAccount;
    }


}