pragma solidity ^0.4.24;

contract Ownable {
    address private _owner;

    event TransferOwnership(address indexed oldOwner, address indexed newOwner);

    constructor () internal {
        _owner = msg.sender;
        emit TransferOwnership(address(0), _owner);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    function renounceOwnership() public onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal {
        emit TransferOwnership(_owner, newOwner);
        _owner = newOwner;
    }

    function kill() public onlyOwner {
        selfdestruct(_owner);
    }
}
