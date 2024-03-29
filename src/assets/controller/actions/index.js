
const settings = require('Config/settings')
let hostUrl = settings.endpoint || `http://${settings.address}${settings.port ? ':' + settings.port : ''}/`
import openSocket from 'socket.io-client';
const  socket = openSocket(hostUrl);

// if (settings.endpoint) {
//     if (settings.port) {
//         hostUrl = hostUrl.substring(0, hostUrl.length - 1) + ':' + settings.port + '/';
//     }
// }

console.log(hostUrl + '\n');
console.log(settings.endpoint + '\n');
console.log(settings.address + '\n');
console.log(settings.port + '\n');

const toAgeStr = (date) => {
    if (date.getTime() == 0) {
        return "Unconfirmed";
    }
    let now = new Date(Date.now()),
        diff = Date.now() - date.getTime()
    let intervals = {
        years: diff / (365 * 24 * 60 * 60 * 1000),
        months: (now.getFullYear() - date.getFullYear()) * 12 - date.getMonth() + 1 + now.getMonth(),
        days: diff / (24 * 60 * 60 * 1000),
        hours: diff / (60 * 60 * 1000),
        minutes: diff / (60 * 1000),
        seconds: diff / (1000),
    }; Object.keys(intervals).forEach(interval => intervals[interval] = Math.floor(intervals[interval]))
    for (let interval in intervals)
        if (intervals[interval] > 1)
            return `${intervals[interval]} ${interval} ago`
    return 'error'
}

function subscribeToBlockStats(cb) {
  socket.on('blockstats', stats => cb(null, stats));
}
function subscribeToNetworkStats(cb) {
    socket.on('networkstats', stats => cb(null, stats));
}
function subscribeToRewardStats(cb) {
    socket.on('rewardstats', stats => cb(null, stats));
}
const Actions = {
    subscribeToBlockStats, 
    subscribeToNetworkStats, 
    subscribeToRewardStats,
    "getBlockDetailData": {
        "header": {
            "BLOCK HEIGHT": async () => {
                try {
                    let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                    return [coinstats.data.blockcount, ""]
                } catch (err) {
                    { console.error("blockcount", err); return [null, "Red"]; }
                }
            }
        },
        "SUPPLY": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return (coinstats.data.connections > 0 ? [Math.ceil(coinstats.data.supply), "Green"] : [null, "Red"])
            } catch (err) { console.error("supply", err); return [null, "Red"] }
        },
        "HASHRATE": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return (coinstats.data.connections > 0 ? [coinstats.data.hashrate, "Green"] : [null, "Red"])
            } catch (err) { console.error("hashrate", err); return [null, "Red"]; }
        },
        "DIFFICULTY": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return (coinstats.data.connections > 0 ? [Number(coinstats.data.difficulty).toFixed(), "Green"]: [null, "Red"])
            } catch (err) { console.error("difficulty", err); return [null, "Red"]; }
        },
        "NETWORK STATUS": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return ( coinstats.data.connections > 0 ?
                    ["GOOD", "Green"]
                    : ["CHAIN ERROR", "Red"])
            } catch (err) { console.error("netStat", err); return ["SERVER ERROR", "Red"]; }
        }
    },


    "getList": async (collection, query = null) => {
        let returnObj = {}
        try {
            let result = await (await fetch(hostUrl + `dapsapi/${collection}/${query ? `${query}` : ''}`)).json()

            if (result.data)
                switch (collection.toLowerCase()) {
                    case "block": returnObj = {
                        "ids": result.data.map((block, i) => block.hash),
                        "headers": ["HEIGHT", "AGE", "HASH", "SIZE"],
                        ...result.data.map((block, i) => [
                            `${block.height}`,
                            `${toAgeStr(new Date(block.time * 1000))}`,
                            `${block.hash}`,
                            `${block.size / 1000} kb`
                        ])
                    }; break
                    case "tx": returnObj = {
                        "ids": result.data.map((tx, i) => tx.txid),
                        "headers": ["HEIGHT", "AGE", "SIZE", "RING SIZE", "TRANSACTION HASH", "AMOUNT"],
                        ...result.data.map((tx, i) => [
                            `${tx.blockindex}`,
                            `${toAgeStr(new Date(tx.time * 1000))}`,
                            `${parseFloat(tx.blocksize) / 1000} kb`,
                            `${tx.ringsize}`,
                            `${tx.txid}`,
                            `${tx.value || 'hidden'}`,
                        ])
                    }; break
                };
        } catch (err) { console.error('getlist', err); return null }
        return returnObj
    },


    "getBlockDetail": async (blockhash) => {
        let returnObj = {}
        try {
            const receivedBlock = (typeof blockhash == 'object') ?
                blockhash :
                (await (await fetch(hostUrl + `dapsapi/block/?hash=${blockhash}&report=0`)).json()).data[0]
            const date = new Date(receivedBlock.time * 1000);
            returnObj = {
                "type": `${receivedBlock.minetype}`,
                "detailData": {
                    [`${date.toDateString()}`]: [date.toTimeString().match(/\d\d:\d\d:\d\d/g), "Yellow"],
                    "TOKENS GENERATED": [`${receivedBlock.moneysupply}`, "Yellow"],
                    "BLOCK REWARD EARNED": [`${receivedBlock.poscount * 1050}`, "Yellow"],
                    "DIFFICULTY": [`${receivedBlock.difficulty}`, "Yellow"],
                },
                "blockData": {
                    "headers": ["HEIGHT", "AGE", "HASH", "SIZE"],
                    "0": [
                        `${receivedBlock.height}`,
                        `${toAgeStr(date)}`,
                        `${receivedBlock.hash}`,
                        `${parseFloat(receivedBlock.size) / 1000} kb`
                    ]
                },
                "txList": {
                    "headers": ["TRANSACTION HASH", "SIZE", "FEE"],
                    ...await Promise.all(receivedBlock.tx.map(async (txid, i) => {
                        let receivedTx = {}; try { receivedTx = (await (await fetch(hostUrl + `dapsapi/tx/?txid=${txid}&report=0`)).json()).data[0] } catch (err) { console.error(err) }
                        return [
                            receivedTx.txid || 'error',
                            (receivedTx.blocksize) ? `${receivedTx.blocksize / 1000} kb` : 'error',
                            receivedTx.txfee || 'error'
                        ]
                    }))
                },
                // "raw": receivedBlock,
                "poaStatus": /*(receivedBlock.minetype == 'PoS') ? "EXTRACTED MASTERNODE / STAKING" :*/ '',
                "PosMessage": (receivedBlock.minetype == 'PoA') ? "ON THIS DATE AND TIME, THE DAPS CHAIN'S CURRENT SUPPLY WAS AUDITED,[SPLIT]AND THE POS BLOCK REWARDS ADD UP TO THE EXPECTED AMOUNT." : '',
                "Audited": (receivedBlock.minetype == 'PoA') ? { " POS BLOCKS AUDITED": `${receivedBlock.poscount}` } : ''
            }
        } catch (err) { console.error("block", error); return null }
        return await returnObj;
    },
    "getGenesisBlockDetail": async (blockhash) => {
        let returnObj = {}
        try {
            const receivedBlock = (await (await fetch(hostUrl + `dapsapi/block/?hash=${blockhash}&report=0`)).json()).data[0]
            let blockcount = await (await fetch(hostUrl + 'api/getblockcount')).json();
            const date = new Date(receivedBlock.time * 1000);
            returnObj = {
                "type": `${receivedBlock.minetype}`,
                "detailData": {
                    "DATE": `${date.getDate() + '/' + (date.getMonth() + 1) + '/' +  date.getFullYear()}`,
                    "TIME": date.toTimeString().match(/\d\d:\d\d:\d\d/g),
                    "TOKENS GENERATED": `${receivedBlock.moneysupply}`,
                    "BLOCK REWARD EARNED": `${receivedBlock.poscount * 1050}`,
                    "DIFFICULTY": `${receivedBlock.difficulty}`,
                },
                "blockData": {
                    "HEIGHT": `${receivedBlock.height}`,
                    "CONFIRMATIONS": `${blockcount - receivedBlock.height}`,
                    "HASH": `${receivedBlock.hash}`,
                    "SIZE": `${parseFloat(receivedBlock.size) / 1000} kb`
                }
            }
        } catch (err) { console.error("block", error); return null }
        return await returnObj;
    },


    "getTxDetail": async (id) => {
        let returnObj = {}
        try {
            console.log(id, (typeof id));
            const receivedTx = (typeof id == 'object') ?
                id :
                (await (await fetch(hostUrl + `dapsapi/tx/?txid=${id}&report=0`)).json()).data[0];
            const date = new Date(receivedTx.time * 1000);
            const type = receivedTx.vout[0].scriptPubKey.type
            returnObj = {
                "detailData": {
                    [`${date.getTime() != 0 ? date.toDateString() : "Unconfirmed"}`]: [date.getTime() != 0 ? date.toTimeString().match(/\d\d:\d\d:\d\d/g) : "", date.getTime() != 0 ? "Yellow" : "Red"],
                    "Confirmations": [
                        `${receivedTx.confirmations} of ${receivedTx.confirmationsneeded}`,
                        (receivedTx.confirmations >= receivedTx.confirmationsneeded) ? "Green"
                            : (receivedTx.confirmations > 10) ? "Yellow" : "Red",
                    ],
                },
                "blockData": {
                    "headers": ["HEIGHT", "AGE", "SIZE", "RING SIZE", "TRANSACTION HASH", "FEE"],
                    "0": [
                        `${receivedTx.blockindex}`,
                        `${toAgeStr(date)}`,
                        `${parseFloat(receivedTx.blocksize) / 1000} kb`,
                        `${receivedTx.ringsize}`,
                        `${receivedTx.txid}`,
                        `${receivedTx.txfee}`
                    ]
                },
                "txPubkey" : (receivedTx.vout[0].txpubkey != undefined && receivedTx.vout[0].txpubkey != null ? receivedTx.vout[0].txpubkey : ""),
                "input": {
                    "headers": [receivedTx.vin.filter((vin) => vin.keyimage).length ? "Key Image" : ''],
                    ...receivedTx.vin.map((vin) => [`${vin.keyimage || ''}`])
                },
                "output": {
                    "headers": ["Stealth Address", "Amount"],
                    ...receivedTx.vout.map((vout, i) => [
                        `${(vout.scriptPubKey.type == 'pubkey') ?
                            vout.scriptPubKey.addresses[0] || 'error'
                            : vout.scriptPubKey.type}`,
                        `${vout.value ? vout.value : 'hidden'}`,
                    ])
                },
                "isStealth": (receivedTx.vout[0].scriptPubKey.type == 'pubkey') ? receivedTx.vout.map((vout, i) => (
                    vout.scriptPubKey.type == 'pubkey') ? {
                        "address": vout.scriptPubKey.addresses[0],
                        "encodedamount": vout.encoded_amount,
                        "encodedmask": vout.encoded_mask,
                        } : false) : false,
                // "raw": receivedTx,
            };
        } catch (err) { console.error("tx", err); return null; }
        return returnObj;
    },


    "getNetworkDetailData": {
        "header": {
            "LAST POA BLOCK": async () => {
                try {
                    let response = await (await fetch(hostUrl + 'dapsapi/block/?minetype=PoA&sort=-height&limit=1&report=0')).json()
                    let date = response.data ? new Date(response.data[0].time * 1000) : null
                    return date ? [toAgeStr(date), ""] : ['none found', "Yellow"]
                } catch (err) { console.error("lastpoa", err); return [null, "Red"]; }
            }
        },
        "NODES": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return [coinstats.data.connections || 'error', "Green"]
            } catch (err) { console.error("nodes", err); return [null, "Red"]; }
        },
        "MASTER NODES": async () => {
            try {
                let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
                return [(coinstats.data.masternodeconnections != undefined) ? coinstats.data.masternodeconnections : 'disconnected', "Green"]
            } catch (err) { console.error("mnodes", err); return [null, "Red"]; }
        },
        // "BITCOIN PRICE": async () => {
        //     try {
        //         let response = await (await fetch(hostUrl + `dapsapi/stats/?coin=BTC&report=0`)).json()
        //         return [(response.data != undefined) ? `${response.data[0].last_price}` : 'not found', "Green"]
        //     } catch (err) { console.error("btcprice", err); return [null, "Red"]; }
        // },
        // "BTC / DAPS": async () => {
        //     try {
        //         let response = await (await fetch(hostUrl + `dapsapi/stats/?coin=${settings.coin}&report=0`)).json()
        //         return [(response.data != undefined) ? `${response.data[0].last_price}` : 'not found', "Green"]
        //     } catch (err) { console.error("btc/daps", err); return [null, "Red"]; }
        // }
    },


    "getBlockHash": async (index) => {
        try {
            let response = await fetch(hostUrl + `api/getblockhash?index` + index)
            return response
        } catch (err) { console.error("getblockhash", err); return null; }
    },

    "getSearchPromises": async (string, url) => {
        let returnObj = {}
        let category = 0; // 0: all, 1: PoS, 2: PoA, 3: block, 4: tx
        if (url.includes("/overview")) {
            category = 0; 
        } else if (url.includes("/Posblocks")) {
            category = 1;
        } else if (url.includes("/Poablocks")) {
            category = 2;
        } else if (url.includes("/genesis")) {
            category = 3;
        } else if (url.includes("/transactions")) {
            category = 4;
        } else if (url.includes("block")) {
            category = 3;
        } else if (url.includes("tx")) {
            category = 4;
        }
        if (string.length > 1)
            returnObj = {
                tx: [
                    (category == 0 || category == 4) ? (await (await fetch(hostUrl + `dapsapi/tx/?txid=$regex:.*${string}.*`)).json()) : "",
                    
                ],
                block: [
                    await (await fetch(hostUrl + `dapsapi/block/?hash=$regex:.*${string}.*`)).json(),
                     (category == 0 || category == 3) ? await (await fetch(hostUrl + `dapsapi/block/?hash=$regex:.*${string}.*`)).json() :
                      (category == 1) ? await (await fetch(hostUrl + `dapsapi/block/?minetype=PoS&hash=$regex:.*${string}.*`)).json() :
                      (category == 2) ? await (await fetch(hostUrl + `dapsapi/block/?minetype=PoA&hash=$regex:.*${string}.*`)).json() : ""
                ],
            }
        return returnObj
    },

    "getTxCount": async () => {
        try {
            let response = await (await fetch(hostUrl + `dapsapi/tx/?count=true`)).json()
            return response.data
        } catch (err) { console.error("txcount", err); return null; }
    },
    "getBlockCount": async () => {
        try {
            let response = await (await fetch(hostUrl + `dapsapi/block/?count=true`)).json()
            return response.data
        } catch (err) { console.error("blockcount", err); return null; }
    },
    "getPoaBlockCount": async () => {
        try {
            let response = await (await fetch(hostUrl + `dapsapi/block/?count=true&minetype='PoA'`)).json()
            return response.data
        } catch (err) { console.error("blockcount", err); return null; }
    },
    "getPosBlockCount": async () => {
        try {
            let response = await (await fetch(hostUrl + `dapsapi/block/?count=true&minetype='PoS'`)).json()
            return response.data
        } catch (err) { console.error("blockcount", err); return null; }
    },
    "getSeesawData": async () => {
        try {
            let coinstats = await (await fetch(hostUrl + `dapsapi/coinstats`)).json()
             return [coinstats.data.masternode_reward_ratio, coinstats.data.masternodeconnections];
        } catch (err) { console.error("seesawdata", err); return [0, 0]; }
    },

}

export default Actions;