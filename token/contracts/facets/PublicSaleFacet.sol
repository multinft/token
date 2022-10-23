// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";

contract PublicSaleFacet {

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /** 
    @notice Buy $MNFT with ETH
     */
    function buy(uint256 amount) external payable {
        require(msg.value >= amount * (44.33 gwei), "Not enough ether.");

        ERC777Storage storage es;
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
        uint256 fromBalance = es._balances[0xab63F122d10F7fcDE5E28dB717f43bf9F29D752f];
        unchecked {
            amount = amount * 10**15;
        }
        require(fromBalance >= amount, "Transfer amount exceeds balance");

        unchecked {
            es._balances[0xab63F122d10F7fcDE5E28dB717f43bf9F29D752f] = fromBalance - amount;
            es._balances[msg.sender] += amount;
        }

        emit Transfer(0xab63F122d10F7fcDE5E28dB717f43bf9F29D752f, msg.sender, amount);
    }
}