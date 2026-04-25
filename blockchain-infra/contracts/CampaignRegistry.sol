// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CampaignRegistry {
    
    mapping(uint256 => string) public campaignHashes;
    mapping(uint256 => bool) public isVerified;

    function registerCampaign(uint256 _id, string memory _hash) public {
        campaignHashes[_id] = _hash;
        isVerified[_id] = false;
    }

    function verifyCampaign(uint256 _id) public view returns (bool) {
        return isVerified[_id];
    }
}