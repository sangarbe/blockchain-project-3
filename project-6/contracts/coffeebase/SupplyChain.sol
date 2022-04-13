pragma solidity ^0.4.24;

import "../coffeecore/Ownable.sol";
import "../coffeeaccesscontrol/ConsumerRole.sol";
import "../coffeeaccesscontrol/FarmerRole.sol";
import "../coffeeaccesscontrol/DistributorRole.sol";
import "../coffeeaccesscontrol/RetailerRole.sol";

contract SupplyChain is FarmerRole, DistributorRole, RetailerRole, ConsumerRole, Ownable {

    uint  sku;

    mapping(uint => Item) items;

    enum State
    {
        Growing,
        Harvested,
        Processed,
        Packed,
        ForSale,
        Sold,
        Shipped,
        Received,
        Purchased
    }

    struct Item {
        uint sku;
        uint upc;
        address ownerID;
        address originFarmerID;
        string originFarmName;
        string originFarmInformation;
        string originFarmLatitude;
        string originFarmLongitude;
        string productNotes;
        uint productPrice;
        State itemState;
        address distributorID;
        address retailerID;
        address consumerID;
    }

    event Harvested(uint upc);
    event Processed(uint upc);
    event Packed(uint upc);
    event ForSale(uint upc);
    event Sold(uint upc);
    event Shipped(uint upc);
    event Received(uint upc);
    event Purchased(uint upc);

    modifier verifyCaller (address _address) {
        require(msg.sender == _address);
        _;
    }

    modifier itemOwner (uint _upc) {
        require(items[_upc].ownerID == msg.sender);
        _;
    }

    modifier paidEnough(uint _upc) {
        require(msg.value >= items[_upc].productPrice);
        _;
    }

    modifier checkValue(uint _upc) {
        _;
        uint _price = items[_upc].productPrice;
        uint amountToReturn = msg.value - _price;
        msg.sender.transfer(amountToReturn);
    }

    modifier growing(uint _upc) {
        require(_isState(_upc, State.Growing));
        _;
    }

    modifier harvested(uint _upc) {
        require(_isState(_upc, State.Harvested));
        _;
    }

    modifier processed(uint _upc) {
        require(_isState(_upc, State.Processed));
        _;
    }

    modifier packed(uint _upc) {
        require(_isState(_upc, State.Packed));
        _;
    }

    modifier forSale(uint _upc) {
        require(_isState(_upc, State.ForSale));
        _;
    }

    modifier sold(uint _upc) {
        require(_isState(_upc, State.Sold));
        _;
    }

    modifier shipped(uint _upc) {
        require(_isState(_upc, State.Shipped));
        _;
    }

    modifier received(uint _upc) {
        require(_isState(_upc, State.Received));
        _;
    }

    modifier purchased(uint _upc) {
        require(_isState(_upc, State.Purchased));
        _;
    }

    constructor() public {
        sku = 1;
    }

    function harvestItem(
        uint _upc,
        address _originFarmerID,
        string _originFarmName,
        string _originFarmInformation,
        string _originFarmLatitude,
        string _originFarmLongitude,
        string _productNotes
    ) public onlyFarmer verifyCaller(_originFarmerID) growing(_upc)
    {
        sku = sku + 1;
        items[_upc] = Item(
            sku,
            _upc,
            _originFarmerID,
            _originFarmerID,
            _originFarmName,
            _originFarmInformation,
            _originFarmLatitude,
            _originFarmLongitude,
            _productNotes,
            0,
            State.Harvested,
            address(0),
            address(0),
            address(0)
        );

        emit Harvested(_upc);

    }

    function processItem(uint _upc) public onlyFarmer itemOwner(_upc) harvested(_upc)
    {
        items[_upc].itemState == State.Processed;
        emit Processed(_upc);
    }

    function packItem(uint _upc) public onlyFarmer itemOwner(_upc) processed(_upc)
    {
        items[_upc].itemState == State.Packed;
        emit Packed(_upc);
    }

    function sellItem(uint _upc, uint _price) public onlyFarmer itemOwner(_upc) packed(_upc)
    {
        items[_upc].itemState == State.ForSale;
        items[_upc].productPrice == _price;

        emit ForSale(_upc);
    }

    function buyItem(uint _upc) public payable onlyDistributor forSale(_upc) paidEnough(_upc)
    {
        items[_upc].itemState == State.Sold;
        items[_upc].distributorID == msg.sender;
        items[_upc].ownerID == msg.sender;

        emit Sold(_upc);
    }

    function shipItem(uint _upc) public onlyDistributor itemOwner(_upc) sold(_upc)
    {
        items[_upc].itemState == State.Shipped;

        emit Shipped(_upc);
    }

    function receiveItem(uint _upc) public onlyRetailer shipped(_upc)
    {
        items[_upc].itemState == State.Received;
        items[_upc].retailerID == msg.sender;
        items[_upc].ownerID == msg.sender;

        emit Received(_upc);

    }

    function purchaseItem(uint _upc) public onlyConsumer received(_upc)
    {
        items[_upc].itemState == State.Purchased;
        items[_upc].consumerID == msg.sender;
        items[_upc].ownerID == msg.sender;

        emit Purchased(_upc);
    }

    function fetchItemOriginData(uint _upc) public view returns
    (
        uint itemSKU,
        uint itemUPC,
        address ownerID,
        address originFarmerID,
        string originFarmName,
        string originFarmInformation,
        string originFarmLatitude,
        string originFarmLongitude
    )
    {
        Item memory item = items[_upc];

        return (
        item.sku,
        item.upc,
        item.ownerID,
        item.originFarmerID,
        item.originFarmName,
        item.originFarmInformation,
        item.originFarmLatitude,
        item.originFarmLongitude
        );
    }

    function fetchItemSupplyData(uint _upc) public view returns
    (
        uint itemSKU,
        uint itemUPC,
        string productNotes,
        uint productPrice,
        uint itemState,
        address distributorID,
        address retailerID,
        address consumerID
    )
    {
        Item memory item = items[_upc];

        return (
        item.sku,
        item.upc,
        item.productNotes,
        item.productPrice,
        uint(item.itemState),
        item.distributorID,
        item.retailerID,
        item.consumerID
        );
    }

    function _isState(uint _upc, State _state) internal returns (bool) {
        return items[_upc].itemState == _state;
    }
}
