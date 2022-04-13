pragma solidity ^0.4.24;

import "./Roles.sol";

contract DistributorRole {
    using Roles for Roles.RoleMap;

    event DistributorAdded(address indexed account);
    event DistributorRemoved(address indexed account);

    Roles.RoleMap private distributors;

    constructor() internal {
        _addDistributor(msg.sender);
    }

    modifier onlyDistributor() {
        require(isDistributor(msg.sender), "Error: only distributors allowed");
        _;
    }

    function isDistributor(address account) public view returns (bool) {
        return distributors.has(account);
    }

    function addDistributor(address account) public onlyDistributor {
        _addDistributor(account);
    }

    function renounceDistributor() public {
        _removeDistributor(msg.sender);
    }

    function _addDistributor(address account) internal {
        distributors.add(account);
        emit DistributorAdded(account);
    }

    function _removeDistributor(address account) internal {
        distributors.remove(account);
        emit DistributorRemoved(account);
    }
}