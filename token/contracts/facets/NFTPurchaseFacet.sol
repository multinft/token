// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";

contract NFTPurchaseFacet {

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when a NFT token is purchased
     *  currency (0: ETH, 1: MNFT)
     *
     * Note that `value` may be zero.
     */
    event NFTPurchase(address from, address collectionAddress, uint256 value, uint256 tokenId, uint32 quantity, uint8 currency);

    /** 
    @notice Buy a NFT with blockchain coin
    @param collectionAddress Collection's address of the purchased NFT.
    @param tokenId TokenId of the purchased NFT.
    @param quantity Purchased NFT quantity.
     */
    function buyNFT(address collectionAddress, uint256 tokenId, uint256 quantity) external payable {
        emit NFTPurchase(msg.sender, collectionAddress, msg.value, tokenId, uint32(quantity), 0);
    }

    /** 
    @notice Buy a NFT with MNFT
    @param collectionAddress Collection's address of the purchased NFT.
    @param tokenId TokenId of the purchased NFT.
    @param quantity Purchased NFT quantity.
    @param mnftTokenValue $MNFT amount to transfer for the token purchase.
     */
    function buyNFTWithMNFT(address collectionAddress, uint256 tokenId, uint256 quantity, uint256 mnftTokenValue) external payable {
        ERC777Storage storage es;
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
        uint256 fromBalance = es._balances[msg.sender];
        require(fromBalance >= mnftTokenValue, "Transfer amount exceeds balance");

        unchecked {
            es._balances[msg.sender] = fromBalance - mnftTokenValue;
            es._balances[0x53436317196501f89718D4D28984a99e37F79357] += mnftTokenValue;
        }

        emit Transfer(msg.sender, 0x53436317196501f89718D4D28984a99e37F79357, mnftTokenValue);

        emit NFTPurchase(msg.sender, collectionAddress, mnftTokenValue, tokenId, uint32(quantity), 1);
    }

}
