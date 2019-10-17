var mongoose = require('mongoose')
    , Block = require('../models/block')
    , Tx = require('../models/tx')
    , CoinStats = require('../models/coinstats')
const settings = require('../config/settings')
const hostUrl = `http://${settings.address}${settings.port ? ':' + settings.port : ''}/`
const fetch = require('node-fetch')
const chalk = require('chalk')
const request = require('request')

//Update Mongo with Chaincoin api

const update_tx = async (tx, log = false) => {
    try {
        let update = await Tx.findOneAndUpdate({ txid: tx.txid }, tx, { new: true })
            || await Tx.create(tx)
        if (log) console.log('updated tx', chalk.yellow(update.txid))
        return update
    } catch (err) { if (log) console.error(err.message); return false }
}

const update_block = async (block, log = false) => {
    try {
        let update = await Block.findOneAndUpdate({ hash: block.hash }, block, { new: true }).exec()
            || await Block.create(block)
        if (log) console.log('updated block', chalk.blue(update.height))
        return update
    } catch (err) { if (log) console.error(err.message); return false }
}

const update_coinstats = async (coinstats, log = false) => {
    try {
        let update = await CoinStats.findOneAndUpdate({}, coinstats, { new: true })
            || await CoinStats.create(coinstats)
        if (log) console.log('updated coinstats', chalk.yellow(update.supply))
        return update
    } catch (err) { if (log) console.error(err.message); return false }
}

updateDb = async (numToUpdate = 0, log = true) => {
    
    try { 
        let blockcount = await (await fetch(hostUrl + 'api/getblockcount')).json();
        let info = await (await fetch(hostUrl + 'api/getinfo')).json();
        let hashrate = await (await fetch(hostUrl + 'api/getnetworkhashps')).json()
        let connections = (await (await fetch(hostUrl + 'api/getconnectioncount')).json())
        let masternodeconnections = (await (await fetch(hostUrl + 'api/getmasternodecount')).json())
        let seesawrewardratio = (await (await fetch(hostUrl + 'api/getseesawrewardratio')).json())
        console.log("seesawreward", seesawrewardratio["Masternode Reward Ratio"]);
        
        // let difficulty = await (await fetch(hostUrl + 'api/getdifficulty')).json()
        let coinstats = {};
        Object.assign(coinstats, {
            connections: connections,
            masternodeconnections: masternodeconnections.total,
            blockcount: blockcount,
            supply: info.moneysupply,
            difficulty: info.difficulty,
            hashrate: hashrate,
            masternode_reward_ratio: seesawrewardratio["Masternode Reward Ratio"],
            staking_reward_ratio: seesawrewardratio["Staking Reward Ratio"]
        });
        
        update_coinstats(coinstats, true);
    } catch (err) { 
        console.error(err); 
        let coinstats = {};
        Object.assign(coinstats, {
            connections: 0,
        });
        update_coinstats(coinstats, true)
    }

    try { 
        let blockcount = await (await fetch(hostUrl + 'api/getblockcount')).json();
        
        let firstBlock = await Block.count({});
        if (firstBlock > 0)
            firstBlock = firstBlock + 1;

        let lastBlock = firstBlock + numToUpdate;
        if (lastBlock > blockcount - 2)
            lastBlock = blockcount - 2;

        // if ((!numToUpdate) || (blockcount && blockcount < firstBlock)) {
        //     Tx.deleteMany({}, (err, res) => { 
        //         if (err)  {
        //             console.error(err) 
        //             throw "DB: Tx delete all error";
        //         }
        //     })
        //     Block.deleteMany({}, (err, res) => { 
        //         if (err)  {
        //             console.error(err)
        //             throw "DB: Block delete all error";
        //         }
        //     })
        //     console.log(chalk.red(`Mongo reset for fresh sync.`))
        // }

        let successCount = 0
        for (let i = firstBlock; i <= lastBlock; i++)
            successCount = await updateBlock(i) ? successCount + 1 : successCount

        return successCount;
    } catch (err) { 
        console.error(err); 
        return 0; 
    }
}

updateBlock = async (blockheight, log = true) => {
    try {
        let success = true
        request({ uri: `${hostUrl}api/getblockhash?index=${blockheight}`, json: true }, async (err, res, hash) => {
            if (err) { if (log) console.error(err.message); success = false; }
            else request({ uri: `${hostUrl}api/getblock?hash=${hash}`, json: true }, async (err, res, block) => {
                if (err) { if (log) console.error(err.message); success = false; }
                else {
                    Object.assign(block, {
                        sortid: block.height
                    })
                    let update = await update_block(block)
                    if (blockheight == 0)
                        return;
                    
                    if (update.tx) update.tx.forEach((txid, index) => {
                        request({ uri: `${hostUrl}api/getrawtransaction?txid=${txid}&decrypt=1`, json: true }, async (err, res, tx) => {
                            if (err) { if (log) console.error(err.message); success = false; }
                            else {
                                let len = String(block.height).length;
                                Object.assign(tx, {
                                    blockindex: block.height,
                                    blocktype: block.type,
                                    blocksize: block.size,
                                    ringsize: tx.vin && tx.vin.length && tx.vin[0].ringsize || 0,
                                    sortid: String(len) + String(block.height) + "_" + String(index)
                                })
                                let updatetx = await update_tx(tx)
                            }
                        })
                    })
                }
            })
        });
        return success
    } catch (err) { console.error(err); return false }
}


