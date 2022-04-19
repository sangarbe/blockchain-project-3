const App = {
  web3: null,
  web3Provider: null,
  contracts: {},
  emptyAddress: "0x0000000000000000000000000000000000000000",

  init: async () => {
    try {
      await App.initWeb3();
      await App.getCurrentAccountID();
      await App.initSupplyChain();
    } catch (error) {
      console.error(error);
    }
  },

  readForm: async () => {
    App.sku = $("#sku").val();
    App.upc = $("#upc").val();
    App.ownerID = $("#ownerID").val();
    App.originFarmerID = $("#originFarmerID").val();
    App.originFarmName = $("#originFarmName").val();
    App.originFarmInformation = $("#originFarmInformation").val();
    App.originFarmLatitude = $("#originFarmLatitude").val();
    App.originFarmLongitude = $("#originFarmLongitude").val();
    App.productNotes = $("#productNotes").val();
    App.productPrice = $("#productPrice").val();
    App.distributorID = $("#distributorID").val();
    App.retailerID = $("#retailerID").val();
    App.consumerID = $("#consumerID").val();
  },

  initWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      await App.web3Provider.enable();
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    App.web3 = new Web3(App.web3Provider);
  },

  getCurrentAccountID: async () => {
    const accounts = await App.web3.eth.getAccounts();
    App.metamaskAccountID = accounts[0];

    console.log('currentAccountID:', App.metamaskAccountID);
  },

  initSupplyChain: async () => {
    const jsonSupplyChain = '../../build/contracts/SupplyChain.json';
    const artifactSupplyChain = await $.getJSON(jsonSupplyChain);

    const networkId = await App.web3.eth.net.getId();
    const network = artifactSupplyChain.networks[networkId];

    App.contracts.SupplyChain = new App.web3.eth.Contract(
      artifactSupplyChain.abi,
      network.address,
    );

    // await App.fetchEvents();

    App.bindEvents();
  },

  bindEvents: () => {
    $(document).on('click', App.handleButtonClick);
  },

  handleButtonClick: async (event) => {
    event.preventDefault();
    const processId = parseInt($(event.target).data('id'));
    let result;

    try {
      await App.readForm();
      await App.getCurrentAccountID();

      switch (processId) {
        case 1:
          result = await App.harvestItem();
          break;
        case 2:
          result = await App.processItem();
          break;
        case 3:
          result = await App.packItem();
          break;
        case 4:
          result = await App.sellItem();
          break;
        case 5:
          result = await App.buyItem();
          break;
        case 6:
          result = await App.shipItem();
          break;
        case 7:
          result = await App.receiveItem();
          break;
        case 8:
          result = await App.purchaseItem();
          break;
        case 9:
          result = await App.fetchItemBufferOne();
          const result2 = await App.fetchItemBufferTwo();
          result = {...result, ...result2}
          break;
      }

      $("#ftc-item").text(result);
      console.log(processId, result);

    } catch (error) {
      console.error(error);
    }
  },

  harvestItem: async (event) => {
    const {harvestItem} = App.contracts.SupplyChain.methods;
    return await harvestItem(
      App.upc,
      App.metamaskAccountID,
      App.originFarmName,
      App.originFarmInformation,
      App.originFarmLatitude,
      App.originFarmLongitude,
      App.productNotes).send({from: App.metamaskAccountID});
  },

  processItem: async () => {
    const {processItem} = App.contracts.SupplyChain.methods;
    return await processItem(App.upc).send({from: App.metamaskAccountID});
  },

  packItem: async () => {
    const {packItem} = App.contracts.SupplyChain.methods;
    return await packItem(App.upc).send({from: App.metamaskAccountID});
  },

  sellItem: async () => {
    const {sellItem} = App.contracts.SupplyChain.methods;
    const productPrice = App.web3.utils.toWei(App.productPrice, "ether");
    return await sellItem(App.upc, productPrice).send({from: App.metamaskAccountID});
  },

  buyItem: async (event) => {
    const {buyItem} = App.contracts.SupplyChain.methods;
    const walletValue = App.web3.utils.toWei(App.productPrice, "ether");
    return await buyItem(App.upc).send({from: App.metamaskAccountID, value: walletValue});
  },

  shipItem: async () => {
    const {shipItem} = App.contracts.SupplyChain.methods;
    return await shipItem(App.upc).send({from: App.metamaskAccountID});
  },

  receiveItem: async () => {
    const {receiveItem} = App.contracts.SupplyChain.methods;
    return await receiveItem(App.upc).send({from: App.metamaskAccountID});
  },

  purchaseItem: async () => {
    const {purchaseItem} = App.contracts.SupplyChain.methods;
    return await purchaseItem(App.upc).send({from: App.metamaskAccountID});
  },

  fetchItemBufferOne: async () => {
    App.upc = $('#upc').val();
    const {fetchItemOriginData} = App.contracts.SupplyChain.methods;
    const result = await fetchItemOriginData(App.upc).call();
    if (result.itemSKU === "0") {
      throw new Error(`Fetch 1: Item with upc ${App.upc} not found`);
    }

    $('#sku').val(result.itemSKU);
    $('#ownerID').val(result.ownerID);
    $('#originFarmerID').val(result.originFarmerID);
    $('#originFarmName').val(result.originFarmName);
    $('#originFarmInformation').val(result.originFarmInformation);
    $('#originFarmLatitude').val(result.originFarmLatitude);
    $('#originFarmLongitude').val(result.originFarmLongitude);

    return result;
  },

  fetchItemBufferTwo: async () => {
    App.upc = $('#upc').val();
    const {fetchItemSupplyData} = App.contracts.SupplyChain.methods;
    const result = await fetchItemSupplyData(App.upc).call();
    if (result.itemSKU === "0") {
      throw new Error(`Fetch 2: Item with upc ${App.upc} not found`);
    }

    $('#sku').val(result.itemSKU);
    $('#productNotes').val(result.productNotes);
    $('#productPrice').val(App.web3.utils.fromWei(result.productPrice));
    $('#distributorID').val(result.distributorID === App.emptyAddress ? '' : result.distributorID);
    $('#retailerID').val(result.retailerID === App.emptyAddress ? '' : result.retailerID);
    $('#consumerID').val(result.consumerID === App.emptyAddress ? '' : result.consumerID);

    App.disableButtonsForState(parseInt(result.itemState));

    return result;
  },

  disableButtonsForState: (itemState) => {
    $("button").each(function () {
      const btnState = parseInt($(this).data('id'));
      console.log(btnState, itemState)
      if (btnState <= itemState) {
        $(this).prop('disabled', true);
        return;
      }
      $(this).prop('disabled', false);
    });
  },

  fetchEvents: function () {
    if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
      App.contracts.SupplyChain.currentProvider.sendAsync = function () {
        return App.contracts.SupplyChain.currentProvider.send.apply(
          App.contracts.SupplyChain.currentProvider,
          arguments
        );
      };
    }

    App.contracts.SupplyChain.deployed().then(function (instance) {
      var events = instance.allEvents(function (err, log) {
        if (!err)
          $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
      });
    }).catch(function (err) {
      console.log(err.message);
    });

  }
};

$(() => {
  $(window).load(() => {
    App.init();
  });
});
