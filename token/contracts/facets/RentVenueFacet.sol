// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

contract RentVenueFacet {

    event RentVenue(address from, uint256 value);

    /** 
    @notice Rent venue
     */
    function rentVenue() external payable {
        emit RentVenue(msg.sender, msg.value);
    }
}