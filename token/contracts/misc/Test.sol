// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract A {
    uint256 public counter;

    function increment() external {
        ++counter;
    }
}

contract B {

    function remoteIncrement(address _contract) external {
        (bool success, ) = _contract.call(abi.encodeWithSignature("increment()"));
        require(success, "Increment failed");
    }

    function remoteIncrementRevert(address _contract) external {
        (bool success, ) = _contract.call(abi.encodeWithSignature("increment()"));
        require(success, "Increment failed");
        require(false, "Revert forced");
    }
}
