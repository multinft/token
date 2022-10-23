// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { ERC777Storage } from "../facets/MNFTERC777Facet.sol";

struct StakingStorage {
    uint256 _totalTokensStaked;
    address _stakingAccount;
}

contract MNFTStakingFacet {
    event Stake(address indexed from, uint256 amount);
    event Release(address indexed to, uint256 amount);
    event Claim(address indexed from, uint256 amount);
    event ClaimAll(address indexed from);

    /// @notice Returns the StakingStorage struct pointer.
    function getStakingStorage() internal pure returns(StakingStorage storage ss) {
        // ss.slot = keccak256("mnft.staking.storage")
        assembly {
            ss.slot := 0x9d94a552b79e041387c81ff6ef283d25141878a49159d618301326183d77fd04
        }
    }

    /// @notice Returns the ERC777Storage struct pointer.
    function getERC777Storage() internal pure returns(ERC777Storage storage es) {
        // es.slot = keccak256("mnft.erc777.storage")
        assembly {
            es.slot := 0x8fb040e626dc81be524f960fd04848fa1f8d9000e8b837b9a8ed86951edba988
        }
    }

    /** 
    @notice Stake a specific amount of tokens.
    @param amount The amount of token to stake.
     */
    function stake(uint256 amount) external {
        StakingStorage storage ss = getStakingStorage();
        ERC777Storage storage es = getERC777Storage();
        require(amount <= es._balances[msg.sender], "Unsufficient account balance.");
        ss._totalTokensStaked += amount;
        (bool success, ) = address(this).delegatecall(abi.encodeWithSignature("send(address,uint256,bytes)", ss._stakingAccount, amount, ""));
        require(success, "Send failed");
        emit Stake(msg.sender, amount);
    }

    /** 
    @notice Claim a specific amount of staked tokens of the sender
    (if amount is superior to number of tokens staked by the account, the amount of tokens staked will be released instead).
    @param amount The amount of token claimed.
     */
    function claim(uint256 amount) external payable {
        // require(msg.value > 0.002 ether, "Not enough eth for transaction.");
        emit Claim(msg.sender, amount);
    }

    /// @notice Claim all staked tokens of the sender.
    function claimAll() external payable {
        // require(msg.value > 0.002 ether, "Not enough eth for transaction.");
        emit ClaimAll(msg.sender);
    }

    /** 
    @notice Release claimed tokens to the corresponding account.
    @param amount The address of the account.
    @param amount The amount of token released.
     */
    function releaseClaimedTokens(address account, uint256 amount) external {
        LibDiamond.enforceIsContractOwner();
        StakingStorage storage ss = getStakingStorage();
        require(amount <= ss._totalTokensStaked, "Unsufficient tokens staked.");
        ss._totalTokensStaked -= amount;
        (bool success, ) = address(this).delegatecall(abi.encodeWithSignature("operatorSend(address,address,uint256,bytes,bytes)", ss._stakingAccount, account, amount, "", ""));
        require(success, "OperatorSend failed");
        emit Release(account, amount);
    }

    /** 
    @notice Update staking account.
    @param newAccount The address of the new staking account.
     */
    function updateStakingAccount(address newAccount) external {
        LibDiamond.enforceIsContractOwner();
        StakingStorage storage ss = getStakingStorage();
        address oldAccount = ss._stakingAccount;
        ss._stakingAccount = newAccount;
        (bool success, ) = address(this).delegatecall(abi.encodeWithSignature("operatorSend(address,address,uint256,bytes,bytes)", oldAccount, newAccount, ss._totalTokensStaked, "", ""));
        require(success, "OperatorSend failed");
    }
}