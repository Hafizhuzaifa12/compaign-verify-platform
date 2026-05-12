// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CampaignRegistry
/// @notice Immutable attestation registry for Verit-verified campaigns.
///         Stores the SHA-256 content hash of each verified campaign together
///         with the authenticity score and a reference to the off-chain record.
contract CampaignRegistry {
    struct Attestation {
        bytes32 contentHash;
        uint16 authenticityScore; // 0–10000 (basis points of 100.00)
        uint16 deepfakeScore;
        uint64 verifiedAt;
        address verifier;
        string offChainUri; // ipfs://… or https://verit.io/c/cmp_…
    }

    event CampaignAttested(
        bytes32 indexed campaignId,
        bytes32 contentHash,
        uint16 authenticityScore,
        uint16 deepfakeScore,
        address indexed verifier,
        uint64 verifiedAt
    );

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    address public immutable owner;
    mapping(address => bool) public isVerifier;
    mapping(bytes32 => Attestation) private _attestations;
    uint256 public totalAttestations;

    error NotOwner();
    error NotVerifier();
    error ZeroAddress();
    error AlreadyAttested();
    error InvalidScore();
    error UnknownCampaign();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyVerifier() {
        if (!isVerifier[msg.sender]) revert NotVerifier();
        _;
    }

    constructor() {
        owner = msg.sender;
        isVerifier[msg.sender] = true;
        emit VerifierAdded(msg.sender);
    }

    /// @notice Authorise a new verifier address (e.g. the Verit backend wallet).
    function addVerifier(address verifier) external onlyOwner {
        if (verifier == address(0)) revert ZeroAddress();
        isVerifier[verifier] = true;
        emit VerifierAdded(verifier);
    }

    /// @notice Revoke a previously authorised verifier.
    function removeVerifier(address verifier) external onlyOwner {
        isVerifier[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    /// @notice Publish an attestation for `campaignId`. Each campaignId is one-shot:
    ///         re-attestation is rejected to keep the public trust badge immutable.
    /// @param campaignId   keccak256("cmp_…") — stable id from the off-chain DB.
    /// @param contentHash  sha256 of the canonical media bundle.
    /// @param authBp       authenticity score, 0–10000 (e.g. 9740 = 97.40).
    /// @param dfBp         deepfake-risk score, 0–10000.
    /// @param offChainUri  URI of the full verification record.
    function attest(
        bytes32 campaignId,
        bytes32 contentHash,
        uint16 authBp,
        uint16 dfBp,
        string calldata offChainUri
    ) external onlyVerifier {
        if (_attestations[campaignId].verifiedAt != 0) revert AlreadyAttested();
        if (authBp > 10000 || dfBp > 10000) revert InvalidScore();

        _attestations[campaignId] = Attestation({
            contentHash: contentHash,
            authenticityScore: authBp,
            deepfakeScore: dfBp,
            verifiedAt: uint64(block.timestamp),
            verifier: msg.sender,
            offChainUri: offChainUri
        });

        unchecked {
            totalAttestations += 1;
        }

        emit CampaignAttested(
            campaignId,
            contentHash,
            authBp,
            dfBp,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    /// @notice Fetch an attestation. Reverts if the campaign has never been attested.
    function getAttestation(
        bytes32 campaignId
    ) external view returns (Attestation memory) {
        Attestation memory a = _attestations[campaignId];
        if (a.verifiedAt == 0) revert UnknownCampaign();
        return a;
    }

    /// @notice Cheap existence check used by the badge endpoint.
    function isAttested(bytes32 campaignId) external view returns (bool) {
        return _attestations[campaignId].verifiedAt != 0;
    }
}
