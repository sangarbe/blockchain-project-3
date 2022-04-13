const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const SupplyChain = artifacts.require('SupplyChain')

contract('SupplyChain', function (accounts) {
  // Declare few constants and assign a few sample accounts generated by ganache-cli
  let supplyChain;
  let sku = 1
  let upc = 1
  const ownerID = accounts[0]
  const originFarmerID = accounts[1]
  const originFarmName = "John Doe"
  const originFarmInformation = "Yarray Valley"
  const originFarmLatitude = "-38.239770"
  const originFarmLongitude = "144.341490"
  const productNotes = "Best beans for Espresso"
  const productPrice = web3.utils.toWei("1", "ether")
  const distributorID = accounts[2]
  const retailerID = accounts[3]
  const consumerID = accounts[4]

  before(async () => {
    supplyChain = await SupplyChain.deployed();

    let receipt = await supplyChain.addFarmer(originFarmerID, {from: ownerID});
    expectEvent(receipt, "FarmerAdded", {account: originFarmerID});
    receipt = await supplyChain.addDistributor(distributorID, {from: ownerID});
    expectEvent(receipt, "DistributorAdded", {account: distributorID});
    receipt = await supplyChain.addRetailer(retailerID, {from: ownerID});
    expectEvent(receipt, "RetailerAdded", {account: retailerID});
    receipt = await supplyChain.addConsumer(consumerID, {from: ownerID});
    expectEvent(receipt, "ConsumerAdded", {account: consumerID});
  });

  // Harvest coffee

  it("allows farmers to harvest coffee", async () => {
    const receipt = await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID})
    expectEvent(receipt, "Harvested", {upc: new BN(upc)});

    const origin = await supplyChain.fetchItemOriginData.call(upc);
    const supply = await supplyChain.fetchItemSupplyData.call(upc);

    assert.equal(origin[0], sku, 'Error: Invalid item SKU');
    assert.equal(origin[1], upc, 'Error: Invalid item UPC');
    assert.equal(origin[2], originFarmerID, 'Error: Missing or Invalid ownerID');
    assert.equal(origin[3], originFarmerID, 'Error: Missing or Invalid originFarmerID');
    assert.equal(origin[4], originFarmName, 'Error: Missing or Invalid originFarmName');
    assert.equal(origin[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation');
    assert.equal(origin[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude');
    assert.equal(origin[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude');
    assert.equal(supply[4], 1, 'Error: Invalid item State');
  })

  it("verifies only farmers have rights to harvest coffee", async () => {
    await expectRevert(supplyChain.harvestItem(upc, distributorID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: distributorID}), "Error: only farmers allowed");
  })

  it("verifies sender is the origin farmer to harvest coffee", async () => {
    await expectRevert(supplyChain.harvestItem(upc, distributorID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID}), "Error: address is not the caller");
  })

  it("verifies upc is not already used to harvest coffee", async () => {
    await expectRevert(supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID}), "Error: item already harvested");
  })


  // Process coffee

  it("allows farmers to process coffee", async () => {
    const receipt = await supplyChain.processItem(upc, {from: originFarmerID});
    expectEvent(receipt, "Processed", {upc: new BN(upc)});

    const supply = await supplyChain.fetchItemSupplyData.call(upc);
    assert.equal(supply[4], 2, 'Error: Invalid item State');
  })

  it("verifies only farmers have rights to process coffee", async () => {
    await expectRevert(supplyChain.processItem(upc, {from: distributorID}), "Error: only farmers allowed");
  })

  it("verifies only owners have rights to process coffee", async () => {
    await expectRevert(supplyChain.processItem(upc, {from: ownerID}), "Error: caller is not item's owner");
  })

  it("verifies only harvested coffee can be processed", async () => {
    await expectRevert(supplyChain.processItem(upc, {from: originFarmerID}), "Error: item is not harvested");
  })


  // Pack coffee

  it("allows farmers to pack coffee", async () => {
    const receipt = await supplyChain.packItem(upc, {from: originFarmerID});
    expectEvent(receipt, "Packed", {upc: new BN(upc)});

    const supply = await supplyChain.fetchItemSupplyData.call(upc);
    assert.equal(supply[4], 3, 'Error: Invalid item State');
  })

  it("verifies only farmers have rights to pack coffee", async () => {
    await expectRevert(supplyChain.packItem(upc, {from: distributorID}), "Error: only farmers allowed");
  })

  it("verifies only owners have rights to pack coffee", async () => {
    await expectRevert(supplyChain.packItem(upc, {from: ownerID}), "Error: caller is not item's owner");
  })

  it("verifies only processed coffee can be packed", async () => {
    await expectRevert(supplyChain.packItem(upc, {from: originFarmerID}), "Error: item is not processed");
  })


  // Put coffee on sale

  it("allows farmers to sell coffee", async () => {
    const receipt = await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});
    expectEvent(receipt, "ForSale", {upc: new BN(upc)});

    const supply = await supplyChain.fetchItemSupplyData.call(upc);
    assert.equal(supply[3], productPrice, 'Error: Invalid item price');
    assert.equal(supply[4], 4, 'Error: Invalid item State');
  })

  it("verifies only farmers have rights to sell coffee", async () => {
    await expectRevert(supplyChain.sellItem(upc, productPrice, {from: distributorID}), "Error: only farmers allowed");
  })

  it("verifies only owners have rights to sell coffee", async () => {
    await expectRevert(supplyChain.sellItem(upc, productPrice, {from: ownerID}), "Error: caller is not item's owner");
  })

  it("verifies only packed coffee can be put on sale", async () => {
    await expectRevert(supplyChain.sellItem(upc, productPrice, {from: originFarmerID}), "Error: item is not packed");
  })

  // Buy coffee on sale

  it("allows distributors to buy coffee", async () => {
    const receipt = await supplyChain.buyItem(upc, {
      from: distributorID,
      value: productPrice
    });
    expectEvent(receipt, "Sold", {upc: new BN(upc)});

    const origin = await supplyChain.fetchItemOriginData.call(upc);
    const supply = await supplyChain.fetchItemSupplyData.call(upc);

    assert.equal(origin[2], distributorID, 'Error: Missing or Invalid ownerID');
    assert.equal(supply[4], 5, 'Error: Invalid item State');
    assert.equal(supply[5], distributorID, 'Error: Invalid item distributor');
  })

  it("verifies only distributors have rights to buy coffee", async () => {
    await expectRevert(supplyChain.buyItem(upc, {
      from: retailerID,
      value: productPrice
    }), "Error: only distributors allowed");
  })

  it("verifies if paid enough to buy coffee", async () => {
    const lessProductPrice = web3.utils.toWei("0.9", "ether");
    await expectRevert(supplyChain.buyItem(upc, {
      from: distributorID,
      value: lessProductPrice
    }), "Error: not paid enough");
  })

  it("verifies only for sale coffee can be bought", async () => {
    await expectRevert(supplyChain.buyItem(upc, {
      from: distributorID,
      value: productPrice
    }), "Error: item is not for sale");
  })


  // Ship coffee

  it("allows distributors to ship coffee", async () => {
    const receipt = await supplyChain.shipItem(upc, {from: distributorID});
    expectEvent(receipt, "Shipped", {upc: new BN(upc)});

    const supply = await supplyChain.fetchItemSupplyData.call(upc);
    assert.equal(supply[4], 6, 'Error: Invalid item State');
  })

  it("verifies only distributors have rights to ship coffee", async () => {
    await expectRevert(supplyChain.shipItem(upc, {from: retailerID}), "Error: only distributors allowed");
  })

  it("verifies only owners have rights to ship coffee", async () => {
    await expectRevert(supplyChain.shipItem(upc, {from: ownerID}), "Error: caller is not item's owner");
  })

  it("verifies only sold coffee can be shipped", async () => {
    await expectRevert(supplyChain.shipItem(upc, {from: distributorID}), "Error: item is not sold");
  })


  // Receive coffee

  it("allows retailers to receive coffee", async () => {
    const receipt = await supplyChain.receiveItem(upc, {from: retailerID});
    expectEvent(receipt, "Received", {upc: new BN(upc)});

    const origin = await supplyChain.fetchItemOriginData.call(upc);
    const supply = await supplyChain.fetchItemSupplyData.call(upc);

    assert.equal(origin[2], retailerID, 'Error: Missing or Invalid ownerID');
    assert.equal(supply[4], 7, 'Error: Invalid item State');
    assert.equal(supply[6], retailerID, 'Error: Invalid item distributor');
  })

  it("verifies only retailers have rights to receive coffee", async () => {
    await expectRevert(supplyChain.receiveItem(upc, {from: consumerID}), "Error: only retailers allowed");
  })

  it("verifies only shipped coffee can be received", async () => {
    await expectRevert(supplyChain.receiveItem(upc, {from: retailerID}), "Error: item is not shipped");
  })


  // Puchase coffee

  it("allows consumers to purchase coffee", async () => {
    const receipt = await supplyChain.purchaseItem(upc, {from: consumerID});
    expectEvent(receipt, "Purchased", {upc: new BN(upc)});

    const origin = await supplyChain.fetchItemOriginData.call(upc);
    const supply = await supplyChain.fetchItemSupplyData.call(upc);

    assert.equal(origin[2], consumerID, 'Error: Missing or Invalid ownerID');
    assert.equal(supply[4], 8, 'Error: Invalid item State');
    assert.equal(supply[7], consumerID, 'Error: Invalid item distributor');
  })

  it("verifies only retailers have rights to purchase coffee", async () => {
    await expectRevert(supplyChain.purchaseItem(upc, {from: originFarmerID}), "Error: only consumers allowed");
  })

  it("verifies only received coffee can be purchased", async () => {
    await expectRevert(supplyChain.purchaseItem(upc, {from: consumerID}), "Error: item is not received");
  })

  // Get data

  it("fetches items origin data", async () => {
    const origin = await supplyChain.fetchItemOriginData.call(upc);

    assert.equal(origin[0], sku, 'Error: Invalid item SKU');
    assert.equal(origin[1], upc, 'Error: Invalid item UPC');
    assert.equal(origin[2], consumerID, 'Error: Missing or Invalid ownerID');
    assert.equal(origin[3], originFarmerID, 'Error: Missing or Invalid originFarmerID');
    assert.equal(origin[4], originFarmName, 'Error: Missing or Invalid originFarmName');
    assert.equal(origin[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation');
    assert.equal(origin[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude');
    assert.equal(origin[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude');
  })

  it("fetches items supply chain data", async () => {
    const supply = await supplyChain.fetchItemSupplyData.call(upc);

    assert.equal(supply[0], sku, 'Error: Invalid item SKU');
    assert.equal(supply[1], upc, 'Error: Invalid item UPC');
    assert.equal(supply[2], productNotes, 'Error: Missing or Invalid product notes');
    assert.equal(supply[3], productPrice, 'Error: Missing or Invalid product price');
    assert.equal(supply[4], 8, 'Error: Invalid item State');
    assert.equal(supply[5], distributorID, 'Error: Missing or Invalid distributor');
    assert.equal(supply[6], retailerID, 'Error: Missing or Invalid retailer');
    assert.equal(supply[7], consumerID, 'Error: Missing or Invalid consumer');
  })
});

