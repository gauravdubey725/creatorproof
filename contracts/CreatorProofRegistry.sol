// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreatorProofRegistry
 * @dev Decentralized registry for digital content proofs, timestamping, and verification.
 */
contract CreatorProofRegistry {
    struct ContentRecord {
        string contentId;
        string title;
        string sha256Hash;
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    // Mapping from contentId (e.g. "CP-1001") to ContentRecord
    mapping(string => ContentRecord) private _records;

    // Mapping from SHA-256 hash string to contentId
    mapping(string => string) private _hashToContentId;

    // Events
    event ContentRegistered(
        string indexed contentId,
        string indexed sha256Hash,
        address indexed owner,
        string title,
        uint256 timestamp,
        uint256 blockNumber
    );

    // Custom errors
    error ContentAlreadyExists(string contentId);
    error HashAlreadyRegistered(string sha256Hash, string existingContentId);
    error ContentNotFound(string contentId);
    error InvalidParameters();

    /**
     * @notice Registers a new content cryptographic proof.
     * @param contentId Unique identifier for the content item (e.g. "CP-1001").
     * @param title Title or name of the digital work.
     * @param sha256Hash 64-character hex string representing the SHA-256 hash.
     */
    function registerContent(
        string calldata contentId,
        string calldata title,
        string calldata sha256Hash
    ) external returns (bool) {
        if (bytes(contentId).length == 0 || bytes(sha256Hash).length == 0 || bytes(title).length == 0) {
            revert InvalidParameters();
        }

        if (_records[contentId].exists) {
            revert ContentAlreadyExists(contentId);
        }

        if (bytes(_hashToContentId[sha256Hash]).length > 0) {
            revert HashAlreadyRegistered(sha256Hash, _hashToContentId[sha256Hash]);
        }

        ContentRecord memory record = ContentRecord({
            contentId: contentId,
            title: title,
            sha256Hash: sha256Hash,
            owner: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        _records[contentId] = record;
        _hashToContentId[sha256Hash] = contentId;

        emit ContentRegistered(
            contentId,
            sha256Hash,
            msg.sender,
            title,
            block.timestamp,
            block.number
        );

        return true;
    }

    /**
     * @notice Verifies whether a given contentId matches the provided SHA-256 hash.
     * @param contentId Unique identifier to verify.
     * @param sha256Hash SHA-256 hash to test against the registered record.
     * @return verified True if record exists and hash matches exactly.
     */
    function verifyContent(
        string calldata contentId,
        string calldata sha256Hash
    ) external view returns (bool verified) {
        ContentRecord memory record = _records[contentId];
        if (!record.exists) {
            return false;
        }
        return keccak256(bytes(record.sha256Hash)) == keccak256(bytes(sha256Hash));
    }

    /**
     * @notice Retrieves full record details for a registered content piece.
     * @param contentId Unique identifier to query.
     */
    function getContent(
        string calldata contentId
    ) external view returns (
        string memory id,
        string memory title,
        string memory sha256Hash,
        address owner,
        uint256 timestamp,
        uint256 blockNumber
    ) {
        ContentRecord memory record = _records[contentId];
        if (!record.exists) {
            revert ContentNotFound(contentId);
        }
        return (
            record.contentId,
            record.title,
            record.sha256Hash,
            record.owner,
            record.timestamp,
            record.blockNumber
        );
    }

    /**
     * @notice Retrieves contentId associated with a given SHA-256 hash.
     * @param sha256Hash SHA-256 hash to query.
     */
    function getContentByHash(
        string calldata sha256Hash
    ) external view returns (string memory contentId) {
        contentId = _hashToContentId[sha256Hash];
        if (bytes(contentId).length == 0) {
            revert ContentNotFound(sha256Hash);
        }
        return contentId;
    }
}
