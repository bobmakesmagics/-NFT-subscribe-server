import * as dotenv from 'dotenv'
dotenv.config()
import { Alchemy, Utils } from "alchemy-sdk";
import { networks } from './config.js';
import fetch from 'node-fetch';

const chain = "goerli"

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: networks[chain],
};

const alchemy = new Alchemy(settings);

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

const doSomethingWithTxn = (txn, standard, event_type) => {
    const transaction_hash = txn.transactionHash

    const body = { standard, event_type, chain, transaction_hash };

    console.log(txn, 'transation')
    console.log(body, 'params')

    fetch(`${process.env.SEVERLESS_URL}/subscribe`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        if (!res.ok) {
            throw new Error("Could not connect to serverless api.");
        }
        return res.json();
    })
        .then(json => console.log(json))
        .catch(err => console.error(err));

};

alchemy.ws.on(contractCreationEvents, (txn) => doSomethingWithTxn(txn, "", "creation"));
alchemy.ws.on(ERC721ContractTransferEvents, (txn) => doSomethingWithTxn(txn, "ERC721", "transfer"));
alchemy.ws.on(ERC1155ContractTransferSingleEvents, (txn) => doSomethingWithTxn(txn, "ERC1155", "transfer"));