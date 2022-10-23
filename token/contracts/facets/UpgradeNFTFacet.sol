// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";

// contract UpgradeNFTFacet {

//     /**
//      * @dev Emitted when `value` tokens are moved from one account (`from`) to
//      * another (`to`).
//      *
//      * Note that `value` may be zero.
//      */
//     event Transfer(address indexed from, address indexed to, uint256 value);

//     event UpgradeNFT(address from, address contractAddress, uint256 value, uint8 currency, uint16 tokenId, uint16 itemId);

//     /** 
//     @notice Upgrade a specific NFT of the sender
//     @param tokenId The tokenId of the claimed NFT.
//      */
//     function upgradeNFTWithETH(address contractAddress, uint256 tokenId, uint256 itemId) external payable {
//         emit UpgradeNFT(msg.sender, contractAddress, msg.value, 0, uint16(tokenId), uint16(itemId));
//     }

//     /** 
//     @notice Upgrade a specific NFT of the sender
//     @param tokenId The tokenId of the claimed NFT.
//      */
//     function upgradeNFTWithMNFT(uint256 tokenId, uint256 itemId, uint256 mnftTokenValue) external payable {
//         ERC777Storage storage es;
//         assembly {
//             es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
//         }
//         uint256 fromBalance = es._balances[msg.sender];
//         require(fromBalance >= mnftTokenValue, "Transfer amount exceeds balance");

//         unchecked {
//             es._balances[msg.sender] = fromBalance - mnftTokenValue;
//             es._balances[0x53436317196501f89718D4D28984a99e37F79357] += mnftTokenValue;
//         }

//         emit Transfer(msg.sender, 0x53436317196501f89718D4D28984a99e37F79357, mnftTokenValue);

//         emit UpgradeNFT(msg.sender, contractAddress, mnftTokenValue, 1, uint16(tokenId), uint16(itemId));
//     }

// }
