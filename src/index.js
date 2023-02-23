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

const zeroAddress = Utils.hexZeroPad("0x0", 32);

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
    let index = 0
    if (event_type !== "creation") {
        if (standard === "ERC721") {
            if (txn.topics.length === 4) {
                index = 1
            } else {
                index = -1
            }
        } else if (standard === "ERC1155") {
            index = 2
        }

        if (index > 0) {
            if (txn.topics[index] === zeroAddress) {
                event_type = 'mint'
            } else if (txn.topics[index + 1] === zeroAddress) {
                event_type = 'burn'
            } else {
                event_type = 'transfer'
            }
        }
    }

    if (index >= 0) {
        const transaction_hash = txn.transactionHash
        const address = txn.address

        let creator = ''
        let from = ''
        let to = ''
        let token_id = ''
        let amount = 1

        if (index === 0) {
            creator = Utils.hexStripZeros(txn.topics[2])
        } else if (index === 1) {
            from = Utils.hexStripZeros(txn.topics[1])
            to = Utils.hexStripZeros(txn.topics[2])
            token_id = BigInt(txn.topics[3]).toString()
        } else if (index === 2) {
            from = Utils.hexStripZeros(txn.topics[2])
            to = Utils.hexStripZeros(txn.topics[3])
            const data = txn.data.slice(2)
            token_id = BigInt("0x" + data.slice(0, data.length / 2)).toString()
            amount = parseInt(data.slice(data.length / 2), 16)
        }

        const body = { standard, event_type, chain, transaction_hash, address, creator, from, to, token_id, amount };

        console.log(txn, 'transation')
        console.log(body, 'params')

        fetch(`${process.env.SEVERLESS_URL}/subscribe`, {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => {
            if (!res.ok) {
                throw new Error("Could not reach website.");
            }
            return res.json();
        })
            .then(json => console.log(json))
            .catch(err => console.error(err));
    }
};

alchemy.ws.on(contractCreationEvents, (txn) => doSomethingWithTxn(txn, "", "creation"));
alchemy.ws.on(ERC721ContractTransferEvents, (txn) => doSomethingWithTxn(txn, "ERC721", ""));
alchemy.ws.on(ERC1155ContractTransferSingleEvents, (txn) => doSomethingWithTxn(txn, "ERC1155", ""));