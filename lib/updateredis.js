const settings = require('../config/settings')
const hostUrl = `http://${settings.address}${settings.port ? ':' + settings.port : ''}/`
const fetch = require('node-fetch')
const asyncRedis = require('async-redis')
const client = asyncRedis.createClient()

client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

getmaxmasternodeconnections = async (currentmasternodeconnections) => {
    result = await client.get('masternodeconnectionsarr');
    let arr = [];
    if (result != null)
        arr = JSON.parse(result)
    if (arr.length > settings.masternodecachecount)
        arr.shift()
    arr.push(currentmasternodeconnections)
    await client.set('masternodeconnectionsarr', JSON.stringify(arr));
    return Math.max.apply(null, arr)
}


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

updateRedis = async (log = true) => {
    try { 

        let blockcount = await (await fetch(hostUrl + 'api/getblockcount')).json();
        let info = await (await fetch(hostUrl + 'api/getinfo')).json();
        let hashrate = await (await fetch(hostUrl + 'api/getnetworkhashps')).json()
        let connections = (await (await fetch(hostUrl + 'api/getconnectioncount')).json())
        let masternodeconnections = (await (await fetch(hostUrl + 'api/getmasternodecount')).json())
        let seesawrewardratio = (await (await fetch(hostUrl + 'api/getseesawrewardratio')).json())
        let maxmasternodeconnections = await getmaxmasternodeconnections(masternodeconnections.total);
        let response = await (await fetch(hostUrl + 'dapsapi/block/?minetype=PoA&sort=-height&limit=1&report=0')).json()
        let lastpoablock = response.data ? toAgeStr(new Date(response.data[0].time * 1000)) : "N/A";

        await client.set('lastpoablock', lastpoablock);
        await client.set('connections', connections);
        await client.set('maxmasternodeconnections', maxmasternodeconnections);
        await client.set('blockcount', blockcount);
        await client.set('supply', info.moneysupply);
        await client.set('difficulty', info.difficulty);
        await client.set('hashrate', hashrate);
        await client.set('masternoderewardratio', seesawrewardratio["Masternode Reward Ratio"]);
    } catch (err) { 
        console.error(err); 
        // await client.set('lastpoablock', "");
        // await client.set('connections', 0);
        // await client.set('maxmasternodeconnections', "");
        // await client.set('blockcount', "");
        // await client.set('supply', "");
        // await client.set('difficulty', "");
        // await client.set('hashrate', "");
        // await client.set('masternoderewardratio', "");
    }
}

module.exports = {client};