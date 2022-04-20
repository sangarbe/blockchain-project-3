# Project write-up

### Libraries used

- truffle(5.5.6): used latest version of the truffle version instead the one suggested in the project. This is a personal decision to avoid the stress of frequently using outdated tools and provided starter source code.
- @openzeppelin/test-helpers (^0.5.15): installed for testing purposes, to facilitate the assertion of emitted events and reverted transactions. 
- truffle-hdwallet-provider (^1.0.17): installed for deployment purposes, to be able to deploy the contracts through an Infura node using a custom wallet.

### SupplyChain deployment to Rinkeby

- transaction hash:    0xd305843b2d891cf7eaaa36fcb6f5b5e8f7f7fbfeb08207229d7a82b98966e3c0
- contract address:    0x214f97457633FDEeeC957441d390F78665C979eb
- block number:        10498194
- account:             0xbd59a7cAF8C608c61F8787e8E7F8C19987F48136
- total cost:          0.00331896006306024 ETH


### All versions used

- Truffle v5.5.6 (core: 5.5.6)
- Ganache v^7.0.3
- Solidity - pragma (solc-js)
- Node v16.13.2
- Web3.js v1.5.3

### UML diagrams

- [Activity](../uml/Activity.png)
- [State](../uml/State.png)
- [Sequence](../uml/Sequence.png)
- [Class](../uml/Class.png)