// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import { LibDiamond } from "../libraries/LibDiamond.sol";

struct DataProofStorage {
    bytes32[] _dataProofHistory;
}

contract MNFTDataProofFacet {
    event NewDataProof(bytes32 dataProof);

    /// @notice Returns the DataProofStorage struct pointer.
    function getDataProofStorage() internal pure returns(DataProofStorage storage dps) {
        // ss.slot = keccak256("mnft.dataproof.storage")
        assembly {
            dps.slot := 0xbf68eb0824c8128b8affa89a39513fa0a763c6cc16dfef7d0882eeae4252d015
        }
    }

    /** 
    @notice Add new root hash to history.
    @param newDataProof The new dataProof root hash.
     */
    function addNewHistory(bytes32 newDataProof) external {
        LibDiamond.enforceIsContractOwner();
        (getDataProofStorage())._dataProofHistory.push(newDataProof);
        emit NewDataProof(newDataProof);
    }


    /** 
    @notice Returns all history.
     */
    function getHistory() external view returns(bytes32[] memory) {
        return (getDataProofStorage())._dataProofHistory;
    }
}