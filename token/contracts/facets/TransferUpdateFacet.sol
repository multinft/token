// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";

contract TransferUpdateFacet {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev See {IERC20-transfer}.
     *
     * Unlike `send`, `recipient` is _not_ required to implement the {IERC777Recipient}
     * interface if it is a contract.
     *
     */
    function transfer(address recipient, uint256 amount) external returns (bool) {
        require(recipient != address(0), "ERC777: transfer to the zero address");

        ERC777Storage storage es;
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
        uint256 fromBalance = es._balances[msg.sender];
        require(fromBalance >= amount, "ERC777: transfer amount exceeds balance");

        unchecked {
            es._balances[msg.sender] = fromBalance - amount;
            es._balances[recipient] += amount;
        }

        emit Transfer(msg.sender, recipient, amount);

        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Note that operator and allowance concepts are orthogonal: operators cannot
     * call `transferFrom` (unless they have allowance), and accounts with
     * allowance cannot call `operatorSend` (unless they are operators).
     *
     * Emits {Sent}, {IERC20-Transfer} and {IERC20-Approval} events.
     */
    function transferFrom(
        address holder,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(recipient != address(0), "ERC777: transfer to the zero address");
        require(holder != address(0), "ERC777: transfer from the zero address");
        require(msg.sender != address(0), "ERC777: ERC777: approve to the zero address");
        
        ERC777Storage storage es;
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
        uint256 fromBalance = es._balances[holder];
        require(fromBalance >= amount, "ERC777: transfer amount exceeds balance");

        uint256 currentAllowance = es._allowances[holder][msg.sender];
        require(currentAllowance >= amount, "ERC777: transfer amount exceeds allowance");

        uint256 newAllowance;
        unchecked {
            es._balances[holder] = fromBalance - amount;
            es._balances[recipient] += amount;
            newAllowance = currentAllowance - amount;
        }
        es._allowances[holder][msg.sender] = newAllowance;

        emit Approval(holder, msg.sender, newAllowance);
        emit Transfer(holder, recipient, amount);

        return true;
    }
}