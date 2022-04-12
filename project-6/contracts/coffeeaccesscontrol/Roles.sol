pragma solidity ^0.4.24;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct RoleMap {
        mapping(address => bool) bearer;
    }

    /**
     * @dev give an account access to this role
    */
    function add(RoleMap storage role, address account) internal {
        require(account != address(0));
        require(!has(role, account));

        role.bearer[account] = true;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(RoleMap storage role, address account) internal {
        require(account != address(0));
        require(has(role, account));

        role.bearer[account] = false;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(RoleMap storage role, address account)
    internal
    view
    returns (bool)
    {
        require(account != address(0));
        return role.bearer[account];
    }
}