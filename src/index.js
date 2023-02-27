import * as dotenv from 'dotenv'
dotenv.config()
import { Utils } from "alchemy-sdk";
import { networks } from './config.js';
import { AlchemyMultichainClient } from './alchemy-multichain-client.js'
import fetch from 'node-fetch';

const chains = process.env.NODE_ENV !== 'production' ? ["goerli", "mumbai"] : ["eth", "polygon"]

const defaultConfig = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: networks['eth'],
}

const overrides = chains.map(chain => ({ [networks[chain]]: { apiKey: process.env.ALCHEMY_API_KEY } }))
const alchemy = new AlchemyMultichainClient(defaultConfig, overrides)

const contractCreationInstance = "OwnershipTransferred(address,address)"
const ERC721ContractTransferInstance = "Transfer(address,address,uint256)"
const ERC1155ContractTransferSingleInstance = "TransferSingle(address,address,address,uint256,uint256)"
const ERC1155ContractTransferBatchInstance = "TransferBatch(address,address,address,uint256[],uint256[])"

const contractCreationEvents = {
    topics: [Utils.id(contractCreationInstance)],
};

const ERC721ContractTransferEvents = {
    topics: [Utils.id(ERC721ContractTransferInstance)],
};

const ERC1155ContractTransferSingleEvents = {
    topics: [Utils.id(ERC1155ContractTransferSingleInstance)],
};

const doSomethingWithTxn = (txn, standard, event_type, chain) => {
    const transaction_hash = txn.transactionHash

    const body = { standard, event_type, chain, transaction_hash };
    body.DCENTRAL_EVENT_API_KEY = process.env.DCENTRAL_EVENT_API_KEY

    console.log(txn, 'transation')

    fetch(`${process.env.SEVERLESS_URL}/subscribe`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        if (!res.ok) {
            throw new Error("Error occured.");
        }
        return res.json();
    })
        .then(json => console.log(json))
        .catch(err => console.error(err));

};

chains.forEach(chain => {
    alchemy.forNetwork(networks[chain]).ws.on(contractCreationEvents, (txn) => doSomethingWithTxn(txn, "", "creation", chain));
    alchemy.forNetwork(networks[chain]).ws.on(ERC721ContractTransferEvents, (txn) => doSomethingWithTxn(txn, "ERC721", "transfer", chain));
    alchemy.forNetwork(networks[chain]).ws.on(ERC1155ContractTransferSingleEvents, (txn) => doSomethingWithTxn(txn, "ERC1155", "transfer", chain));
})