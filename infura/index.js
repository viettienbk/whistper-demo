'use strict'

var config = require('./url');
var contract = require('./simple_contract');
var Web3 = require('web3');
var request = require('request');
const ethUtil = require('ethereumjs-util');
var Tx = require('ethereumjs-tx');
var web3 = getWeb3Instant();
var contractInstant = getContractInstant();

function getContractInstant(){
    var tokenContract = web3.eth.contract(contract.abi);
    return tokenContract.at(contract.address);
}

function getWeb3Instant(){
    return new Web3(new Web3.providers.HttpProvider(config.ropsten));
}

function getNonce(_address, cb) {  
    var params = '["' + _address + '","latest"]';
    getTransaction("eth_getTransactionCount", params, cb);
}

function getGasPrice(cb) {
    getTransaction("eth_gasPrice", null, cb);
}

function getData(cb){
    var data = contractInstant.getData.getData();
    var params = '[{"to":"' + contract.address + '","data":"'+ data +'"}, "latest"]';
    getTransaction('eth_call', params, cb);
}

function getTransaction(method, params, cb) {
    var url = 'https://api.infura.io/v1/jsonrpc/rinkeby/' + method;
    if (params != null) {
        url += '?params=' + params;
    }

    console.log(url);

    request({
        method: 'GET',
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }, function(err, response, body) {
        if (err || JSON.parse(body).result === undefined) {
            cb(true);
        } else {
            cb(false, JSON.parse(body).result);
        }
    });
}

function updateData(data, cb){
    var data = contractInstant.updateData.getData(data);
    var privateKey = 'e5dbd29026f97e6828dfa2b12bdcd106316d57ace1958863656df809f24c301e';
    sendRawTransaction(privateKey, data, cb);
}

function getPrivateKey(privateKey) {
    return Buffer(privateKey, 'hex');
}

function privateKeyToAddress(privateKey) {
    var private_key = getPrivateKey(privateKey);
    var address = ethUtil.privateToAddress(private_key).toString('hex');
    return "0x" + address;
}

function getPayloadData(privatekey, data, cb) {

    var address = privateKeyToAddress(privatekey);
    
    //  get nonce
    getNonce(address, function(err,nonce){
        if(err){
            cb(true);
        } else {
            getGasPrice(function(err, gasPrice){
                if(err){
                    cb(true);
                } else {
                    var rawTx = {
                        nonce: nonce,
                        gasPrice: gasPrice,
                        gasLimit: "0x" + Number(200000).toString(16),
                        to: contract.address,
                        value: '0x00',
                        data: data,
                        chainId: 4
                    };
                    var tx = new Tx(rawTx);
                    tx.sign(getPrivateKey(privatekey));
                    cb(false, tx.serialize().toString('hex'));
                }
            });
        }
    });
}

function sendRawTransaction(privatekey, _data, cb) {
    getPayloadData(privatekey, _data, function(err, data) {
        if (err) {
            cb(true);
        } else {
            console.log('data:'+ data);
            request({
                method: 'POST',
                url: 'https://api.infura.io/v1/jsonrpc/rinkeby',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: "{  \"jsonrpc\": \"2.0\",\"method\": \"eth_sendRawTransaction\",  \"params\": [\"0x" + data + "\"]}"
            }, function(err, response, body) {
                if (err || JSON.parse(body).result == undefined) {
                    cb(true);
                } else {
                    cb(false, JSON.parse(body).result);
                }
            });
        }
    });
};

function eventListener(){
    var filter = web3.eth.filter({fromBlock: 0, toBlock: 'latest'});
    
    filter.watch(function (error, log) {
        console.log('event:');
        console.log(error);
        console.log(log);
    });
}

function getTransactionReceipt(hash, cb) {
    var params = '["' + hash + '"]';
    getTransaction('eth_getTransactionReceipt', params, cb);
}

module.exports = {
    getWeb3Instant: getWeb3Instant,
    getContractInstant: getContractInstant,
    getData: getData,
    updateData: updateData,
    eventListener: eventListener,
    getTransactionReceipt: getTransactionReceipt
}

