const Handlers = [
  "",
  "Harvest",
  "Process",
  "Pack",
  "Sell",
  "Buy",
  "Ship",
  "Receive",
  "Purchase",
  "Fetch"
];

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
      await App.fetchEvents();
      App.bindEvents();
    } catch (error) {
      App.logError(error);
    }
  },

  logError: (error) => {
    $("#ftc-item").addClass('error').text(error.message || error);
    console.error(error);
  },

  logResult: (message, result) => {
    $("#ftc-item").removeClass('error').text(message);
    console.log(message, result);
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
  },

  initSupplyChain: async () => {
    const jsonSupplyChain = '../../build/contracts/SupplyChain.json';
    const artifactSupplyChain = await $.getJSON(jsonSupplyChain);

    const networkId = await App.web3.eth.net.getId();
    console.log(networkId);
    const network = artifactSupplyChain.networks[networkId];

    App.contracts.SupplyChain = new App.web3.eth.Contract(
      artifactSupplyChain.abi,
      network.address,
    );
  },

  bindEvents: () => {
    $('button').on('click', App.handleButtonClick);
  },

  runHandler: async (handlerId) => {
    switch (handlerId) {
      case 1:
        return await App.harvestItem();
      case 2:
        return await App.processItem();
      case 3:
        return await App.packItem();
      case 4:
        return await App.sellItem();
      case 5:
        return await App.buyItem();
      case 6:
        return await App.shipItem();
      case 7:
        return await App.receiveItem();
      case 8:
        return await App.purchaseItem();
      case 9:
        return await App.fetchItem();
      default:
        throw Error(`No handler for id ${handlerId}`);
    }
  },

  handleButtonClick: async (event) => {
    event.preventDefault();
    const processId = parseInt($(event.target).data('id'));

    try {
      await App.readForm();
      await App.getCurrentAccountID();
      const result = await App.runHandler(processId);
      const message = `${Handlers[processId]} of UPC item ${App.upc} sent successfully`;

      App.logResult(message, result);

      if (processId < 9) {
        await App.fetchEvents();
        await App.runHandler(9);
      }

    } catch (error) {
      App.logError(error);
    }
  },

  harvestItem: async () => {
    const {harvestItem} = App.contracts.SupplyChain.methods;
    console.log(App.upc,
      App.metamaskAccountID,
      App.originFarmName,
      App.originFarmInformation,
      App.originFarmLatitude,
      App.originFarmLongitude,
      App.productNotes);
    const res = await harvestItem(
      App.upc,
      App.metamaskAccountID,
      App.originFarmName,
      App.originFarmInformation,
      App.originFarmLatitude,
      App.originFarmLongitude,
      App.productNotes).send({from: App.metamaskAccountID});
    console.log(res);
    return res;
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

  fetchItem: async () => {
    App.upc = $('#upc').val();
    const {fetchItemOriginData, fetchItemSupplyData} = App.contracts.SupplyChain.methods;
    const result = {
      ...(await fetchItemOriginData(App.upc).call()),
      ...(await fetchItemSupplyData(App.upc).call()),
    };

    App.disableButtonsForState(parseInt(result.itemState));

    if (result.itemSKU === "0") {
      throw Error(`Item with UPC ${App.upc} not found`);
    }

    $('#sku').val(result.itemSKU);
    $('#ownerID').val(result.ownerID);
    $('#originFarmerID').val(result.originFarmerID);
    $('#originFarmName').val(result.originFarmName);
    $('#originFarmInformation').val(result.originFarmInformation);
    $('#originFarmLatitude').val(result.originFarmLatitude);
    $('#originFarmLongitude').val(result.originFarmLongitude);
    $('#productNotes').val(result.productNotes);
    $('#productPrice').val(App.web3.utils.fromWei(result.productPrice));
    $('#distributorID').val(result.distributorID === App.emptyAddress ? '' : result.distributorID);
    $('#retailerID').val(result.retailerID === App.emptyAddress ? '' : result.retailerID);
    $('#consumerID').val(result.consumerID === App.emptyAddress ? '' : result.consumerID);

    result.uimsg = `Item with UPC ${App.upc} fetched at ${new Date().toISOString()}`

    return result;
  },

  disableButtonsForState: (itemState) => {
    $("button").each(function () {
      const btnState = parseInt($(this).data('id'));
      if (btnState <= itemState) {
        $(this).prop('disabled', true);
        return;
      }
      $(this).prop('disabled', false);
    });
  },

  fetchEvents: async () => {
    await App.contracts.SupplyChain.getPastEvents("allEvents", {fromBlock: "latest"}, (err, logs) => {
      if (err) {
        App.logError(err);
        return;
      }

      const logHistory = $("#ftc-events");

      $.each(logs, (index, log) => {
        logHistory.append(`<li>UPC ${log.returnValues.upc} - ${log.event} - ${log.transactionHash}</li>`);
      });
    });
  }
};

$(() => {
  $(window).load(() => {
    App.init();
  });
});
