pragma solidity ^0.4.24;

import "./Roles.sol";

contract ConsumerRole {
    using Roles for Roles.RoleMap;

    event ConsumerAdded(address indexed account);
    event ConsumerRemoved(address indexed account);

    Roles.RoleMap private consumers;

    constructor() internal {
        _addConsumer(msg.sender);
    }

    modifier onlyConsumer() {
        require(isConsumer(msg.sender), "Error: only consumers allowed");
        _;
    }

    function isConsumer(address account) public view returns (bool) {
        return consumers.has(account);
    }

    function addConsumer(address account) public onlyConsumer {
        _addConsumer(account);
    }

    function renounceConsumer() public {
        _removeConsumer(msg.sender);
    }

    function _addConsumer(address account) internal {
        consumers.add(account);
        emit ConsumerAdded(account);
    }

    function _removeConsumer(address account) internal {
        consumers.remove(account);
        emit ConsumerRemoved(account);
    }
}