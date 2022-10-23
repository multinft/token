// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Sender.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";

struct ERC777Storage {
    mapping(address => uint256) _balances;

    uint256 _totalSupply;

    string _name;
    string _symbol;

    // This isn't ever read from - it's only used to respond to the defaultOperators query.
    address[] _defaultOperatorsArray;

    // Immutable, but accounts may revoke them (tracked in __revokedDefaultOperators).
    mapping(address => bool) _defaultOperators;

    // For each account, a mapping of its operators and revoked default operators.
    mapping(address => mapping(address => bool)) _operators;
    mapping(address => mapping(address => bool)) _revokedDefaultOperators;

    // ERC20-allowances
    mapping(address => mapping(address => uint256)) _allowances;

    // Disable reentrancy
    uint256 _entered;

    // Mapping of partners with associated cashback rate multiplied by 100
    // mapping(address => uint16) _partners;

}

contract MNFTERC777Facet is IERC777, IERC20 {

    event PartnerAdded(address indexed partner, uint16 cashbackRate);
    event PartnerUpdated(address indexed partner, uint16 cashbackRate);
    event PartnerRemoved(address indexed partner);

    function getERC777Storage() internal pure returns(ERC777Storage storage es) {
        // es.slot = keccak256("mnft.erc777.storage")
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
    }

    /**
     * @dev See {IERC777-name}.
     */
    function name() external view override returns (string memory) {
        ERC777Storage storage es = getERC777Storage();
        return es._name;
    }

    /**
     * @dev See {IERC777-symbol}.
     */
    function symbol() external view override returns (string memory) {
        ERC777Storage storage es = getERC777Storage();
        return es._symbol;
    }

    /**
     * @dev See {ERC20-decimals}.
     *
     * Always returns 18, as per the
     * [ERC777 EIP](https://eips.ethereum.org/EIPS/eip-777#backward-compatibility).
     */
    function decimals() external pure returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC777-granularity}.
     *
     * This implementation always returns `1`.
     */
    function granularity() external pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev See {IERC777-totalSupply}.
     */
    function totalSupply() external view override(IERC20, IERC777) returns (uint256) {
        ERC777Storage storage es = getERC777Storage();
        return es._totalSupply;
    }

    /**
     * @dev Returns the amount of tokens owned by an account (`tokenHolder`).
     */
    function balanceOf(address tokenHolder) external view override(IERC20, IERC777) returns (uint256) {
        ERC777Storage storage es = getERC777Storage();
        return es._balances[tokenHolder];
    }

    /**
     * @dev See {IERC777-send}.
     *
     * Also emits a {IERC20-Transfer} event for ERC20 compatibility.
     */
    function send(
        address recipient,
        uint256 amount,
        bytes memory data
    ) external override {
        _send(msg.sender, recipient, amount, data, "", true);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Unlike `send`, `recipient` is _not_ required to implement the {IERC777Recipient}
     * interface if it is a contract.
     *
     * Also emits a {Sent} event.
     */
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(recipient != address(0), "ERC777: transfer to the zero address");
        require(getERC777Storage()._entered == 0, 'Undergoing transaction');

        address from = msg.sender;

        _callTokensToSend(from, from, recipient, amount, "", "");

        _move(from, from, recipient, amount, "", "");

        _callTokensReceived(from, from, recipient, amount, "", "", false);

        return true;
    }

    /**
     * @dev See {IERC777-burn}.
     *
     * Also emits a {IERC20-Transfer} event for ERC20 compatibility.
     */
    function burn(uint256 amount, bytes memory data) external override {
        _burn(msg.sender, amount, data, "");
    }

    /**
     * @dev See {IERC777-isOperatorFor}.
     */
    function isOperatorFor(address operator, address tokenHolder) external view override returns (bool) {
        return _isOperatorFor(operator, tokenHolder);
    }

    /**
     * @dev See {IERC777-isOperatorFor}.
     */
    function _isOperatorFor(address operator, address tokenHolder) internal view returns (bool) {
        ERC777Storage storage es = getERC777Storage();

        return
            operator == tokenHolder ||
            (es._defaultOperators[operator] && !es._revokedDefaultOperators[tokenHolder][operator]) ||
            es._operators[tokenHolder][operator];
    }

    /**
     * @dev See {IERC777-authorizeOperator}.
     */
    function authorizeOperator(address operator) external override {
        require(msg.sender != operator, "ERC777: authorizing self as operator");
        ERC777Storage storage es = getERC777Storage();

        if (es._defaultOperators[operator]) {
            delete es._revokedDefaultOperators[msg.sender][operator];
        } else {
            es._operators[msg.sender][operator] = true;
        }

        emit AuthorizedOperator(operator, msg.sender);
    }

    /**
     * @dev See {IERC777-revokeOperator}.
     */
    function revokeOperator(address operator) external override {
        require(operator != msg.sender, "ERC777: revoking self as operator");
        ERC777Storage storage es = getERC777Storage();

        if (es._defaultOperators[operator]) {
            es._revokedDefaultOperators[msg.sender][operator] = true;
        } else {
            delete es._operators[msg.sender][operator];
        }

        emit RevokedOperator(operator, msg.sender);
    }

    /**
     * @dev See {IERC777-defaultOperators}.
     */
    function defaultOperators() external view override returns (address[] memory) {
        ERC777Storage storage es = getERC777Storage();

        return es._defaultOperatorsArray;
    }

    /**
     * @dev See {IERC777-operatorSend}.
     *
     * Emits {Sent} and {IERC20-Transfer} events.
     */
    function operatorSend(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    ) external override {
        require(_isOperatorFor(msg.sender, sender), "ERC777: caller is not an operator for holder");
        _send(sender, recipient, amount, data, operatorData, true);
    }

    /**
     * @dev See {IERC777-operatorBurn}.
     *
     * Emits {Burned} and {IERC20-Transfer} events.
     */
    function operatorBurn(
        address account,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    ) external override {
        require(_isOperatorFor(msg.sender, account), "ERC777: caller is not an operator for holder");
        _burn(account, amount, data, operatorData);
    }

    /**
     * @dev See {IERC20-allowance}.
     *
     * Note that operator and allowance concepts are orthogonal: operators may
     * not have allowance, and accounts with allowance may not be operators
     * themselves.
     */
    function allowance(address holder, address spender) external view override returns (uint256) {
        ERC777Storage storage es = getERC777Storage();

        return es._allowances[holder][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Note that accounts cannot have allowance issued by their operators.
     */
    function approve(address spender, uint256 value) external override returns (bool) {
        address holder = msg.sender;
        _approve(holder, spender, value);
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
    ) external override returns (bool) {
        require(recipient != address(0), "ERC777: transfer to the zero address");
        require(holder != address(0), "ERC777: transfer from the zero address");
        
        ERC777Storage storage es = getERC777Storage();
        require(es._entered == 0, 'Undergoing transaction');

        address spender = msg.sender;

        _callTokensToSend(spender, holder, recipient, amount, "", "");

        _move(spender, holder, recipient, amount, "", "");

       
        uint256 currentAllowance = es._allowances[holder][spender];
        require(currentAllowance >= amount, "ERC777: transfer amount exceeds allowance");
        _approve(holder, spender, currentAllowance - amount);

        _callTokensReceived(spender, holder, recipient, amount, "", "", false);

        return true;
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * If a send hook is registered for `account`, the corresponding function
     * will be called with `operator`, `data` and `operatorData`.
     *
     * See {IERC777Sender} and {IERC777Recipient}.
     *
     * Emits {Minted} and {IERC20-Transfer} events.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - if `account` is a contract, it must implement the {IERC777Recipient}
     * interface.
     */
    function mint(
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData,
        bool requireReceptionAck
    ) external {
        LibDiamond.enforceIsContractOwner();
        _mint(account, amount, userData, operatorData, requireReceptionAck);
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * If `requireReceptionAck` is set to true, and if a send hook is
     * registered for `account`, the corresponding function will be called with
     * `operator`, `data` and `operatorData`.
     *
     * See {IERC777Sender} and {IERC777Recipient}.
     *
     * Emits {Minted} and {IERC20-Transfer} events.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - if `account` is a contract, it must implement the {IERC777Recipient}
     * interface.
     */
    function _mint(
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData,
        bool requireReceptionAck
    ) internal {
        require(account != address(0), "ERC777: mint to the zero address");
        ERC777Storage storage es = getERC777Storage();

        require((es._totalSupply + amount) <= 4200000000000000000000000000 , 'Mint amount exceed total supply');

        address operator = msg.sender;

        _beforeTokenTransfer(operator, address(0), account, amount);

        unchecked {
            es._totalSupply += amount;
            es._balances[account] += amount;
        }

        _callTokensReceived(operator, address(0), account, amount, userData, operatorData, requireReceptionAck);

        emit Minted(operator, account, amount, userData, operatorData);
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev Send tokens
     * @param from address token holder address
     * @param to address recipient address
     * @param amount uint256 amount of tokens to transfer
     * @param userData bytes extra information provided by the token holder (if any)
     * @param operatorData bytes extra information provided by the operator (if any)
     * @param requireReceptionAck if true, contract recipients are required to implement ERC777TokensRecipient
     */
    function _send(
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData,
        bool requireReceptionAck
    ) internal {
        require(from != address(0), "ERC777: send from the zero address");
        require(to != address(0), "ERC777: send to the zero address");
        require(getERC777Storage()._entered == 0, 'Undergoing transaction');

        address operator = msg.sender;

        _callTokensToSend(operator, from, to, amount, userData, operatorData);

        _move(operator, from, to, amount, userData, operatorData);

        _callTokensReceived(operator, from, to, amount, userData, operatorData, requireReceptionAck);
    }

    /**
     * @dev Burn tokens
     * @param from address token holder address
     * @param amount uint256 amount of tokens to burn
     * @param data bytes extra information provided by the token holder
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    function _burn(
        address from,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    ) internal {
        LibDiamond.enforceIsContractOwner();
        require(from != address(0), "ERC777: burn from the zero address");

        ERC777Storage storage es = getERC777Storage();
        require(es._entered == 0, "Undergoing account transaction");

        address operator = msg.sender;

        _callTokensToSend(operator, from, address(0), amount, data, operatorData);

        _beforeTokenTransfer(operator, from, address(0), amount);

        // Update state variables
        uint256 fromBalance = es._balances[from];
        require(fromBalance >= amount, "ERC777: burn amount exceeds balance");
        unchecked {
            es._balances[from] = fromBalance - amount;
            es._totalSupply -= amount;
        }

        emit Burned(operator, from, amount, data, operatorData);
        emit Transfer(from, address(0), amount);
    }

    function _move(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) private {
        _beforeTokenTransfer(operator, from, to, amount);
        ERC777Storage storage es = getERC777Storage();
        // unchecked {
        //     amount = amount * 1000 * (10000 - es._partners[to]) / 10000 / 1000;
        // }
        uint256 fromBalance = es._balances[from];
        require(fromBalance >= amount, "ERC777: transfer amount exceeds balance");
        unchecked {
            es._balances[from] = fromBalance - amount;
            es._balances[to] += amount;
        }

        emit Sent(operator, from, to, amount, userData, operatorData);
        emit Transfer(from, to, amount);
    }

    /**
     * @dev See {ERC20-_approve}.
     *
     * Note that accounts cannot have allowance issued by their operators.
     */
    function _approve(
        address holder,
        address spender,
        uint256 value
    ) internal {
        require(holder != address(0), "ERC777: approve from the zero address");
        require(spender != address(0), "ERC777: approve to the zero address");
        
        ERC777Storage storage es = getERC777Storage();
        es._allowances[holder][spender] = value;
        emit Approval(holder, spender, value);
    }

    /**
     * @dev Call from.tokensToSend() if the interface is registered
     * @param operator address operator requesting the transfer
     * @param from address token holder address
     * @param to address recipient address
     * @param amount uint256 amount of tokens to transfer
     * @param userData bytes extra information provided by the token holder (if any)
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    function _callTokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) private {
        address implementer = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24)
                                .getInterfaceImplementer(from, 0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895);
        if (implementer != address(0)) {
            ERC777Storage storage es = getERC777Storage();
            es._entered = 1;
            IERC777Sender(implementer).tokensToSend(operator, from, to, amount, userData, operatorData);
            es._entered = 0;
        }
    }

    /**
     * @dev Call to.tokensReceived() if the interface is registered. Reverts if the recipient is a contract but
     * tokensReceived() was not registered for the recipient
     * @param operator address operator requesting the transfer
     * @param from address token holder address
     * @param to address recipient address
     * @param amount uint256 amount of tokens to transfer
     * @param userData bytes extra information provided by the token holder (if any)
     * @param operatorData bytes extra information provided by the operator (if any)
     * @param requireReceptionAck if true, contract recipients are required to implement ERC777TokensRecipient
     */
    function _callTokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData,
        bool requireReceptionAck
    ) private {
        address implementer = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24)
                                .getInterfaceImplementer(to, 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b);
        if (implementer != address(0)) {
            IERC777Recipient(implementer).tokensReceived(operator, from, to, amount, userData, operatorData);
        } else if (requireReceptionAck) {
            require(!LibDiamond.isContract(to), "ERC777: token recipient contract has no implementer for ERC777TokensRecipient");
        }
    }

    /**
     * @dev Hook that is called before any token transfer. This includes
     * calls to {send}, {transfer}, {operatorSend}, minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256 amount
    ) internal {}

    // /** 
    // @notice Add a new partner with a specific cashback rate
    // @param partner The partner's account address.
    // @param cashbackRate The cashback rate on transaction with this partner
    //  */
    // function addPartner(address partner, uint16 cashbackRate) external {
    //     LibDiamond.enforceIsContractOwner();
    //     require(cashbackRate > 0 && cashbackRate < 10000, "Cashback rate must >0 and <10000");
    //     ERC777Storage storage es = getERC777Storage();
    //     require(es._partners[partner] == 0, "Partner already exists.");
    //     es._partners[partner] = cashbackRate;
    //     emit PartnerAdded(partner, cashbackRate);
    // }

    // /** 
    // @notice Update a partner with a new cashback rate
    // @param partner The partner's account address.
    // @param cashbackRate The cashback rate on transaction with this partner
    //  */
    // function updatePartner(address partner, uint16 cashbackRate) external {
    //     LibDiamond.enforceIsContractOwner();
    //     require(cashbackRate > 0 && cashbackRate < 10000, "Cashback rate must >0 and <10000");
    //     ERC777Storage storage es = getERC777Storage();
    //     require(cashbackRate != es._partners[partner], "Cashback rate not modified.");
    //     es._partners[partner] = cashbackRate;
    //     emit PartnerUpdated(partner, cashbackRate);
    // }

    // /** 
    // @notice Remove partner
    // @param partner The partner's account address.
    //  */
    // function removePartner(address partner) external {
    //     LibDiamond.enforceIsContractOwner();
    //     ERC777Storage storage es = getERC777Storage();
    //     delete es._partners[partner];
    //     emit PartnerRemoved(partner);
    // }

    function withdrawEth() external {
        LibDiamond.enforceIsContractOwner();
        (bool os, ) = payable(LibDiamond.diamondStorage().contractOwner).call{value: address(this).balance}("");
        require(os);
    }
}