// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CampaignVerification {

    struct Campaign {
        string contentHash;
        uint256 timestamp;
        address creator;
    }

    mapping(uint256 => Campaign) public campaigns;

    function storeCampaign(uint256 id, string memory hash) public {
        campaigns[id] = Campaign(hash, block.timestamp, msg.sender);
    }

    function verifyCampaign(uint256 id, string memory hash) public view returns (bool) {
        return keccak256(abi.encodePacked(campaigns[id].contentHash)) ==
               keccak256(abi.encodePacked(hash));
    }
}