const express = require('express')
  , path = require('path')
  , fs = require('fs')
  , chaincoinapi = require('chaincoin-node-api')
  , cors = require('cors')
  , helmet = require('helmet')
  , settings = require('./config/serversetting')
  // , lib = require('./lib/explorer')
  // , db = require('./lib/database')
  , dapsapi = require('./lib/dapsapi')
  // , locale = require('./lib/locale')
  , mongoose = require('mongoose')
  , webpackModule = require('webpack')
  , webpackConfig = require('./webpack.config.js')
  , compiler = webpackModule(webpackConfig)
  , webpackMiddleWare = require("webpack-hot-middleware")(compiler)
  , chalk = require('chalk')
  , dbsync = require('./lib/updatedb')
  , uredis = require('./lib/updateredis')
  , favicon = require('serve-favicon')
  , bodyParser = require('body-parser');


// Database init
const dbs = settings.dbsettings
mongoose.connect(`mongodb://${dbs.user}:${dbs.password}@${dbs.address}:${dbs.port}/${dbs.database}`, (err) =>
  console.log((!err) ?
    chalk.green("Connected") + " to mongo: " + chalk.yellow(dbs.database)
    : chalk.red("Mongo connection error: ") + err))


const updateMongo = async (numToUpdate=0, log = true) => {
  let start = Date.now()
  if (log) console.log(chalk.blue('Refreshing local db with chaincoin api'))
  let updated = await updateDb(numToUpdate, log)
  if (log) console.log('Updated ', updated ? chalk.green(updated) : chalk.red(updated), 'blocks in ' +chalk.yellow(`${new Date(Date.now()-start).getSeconds()} seconds`))
  setTimeout(() => updateMongo(300), 1 * 15 * 1000);
}

setTimeout(() => updateMongo(), 3000)


const updateCache = async (log = true) => {
  if (log) console.log(chalk.blue('Refreshing redis cache with chaincoin api'));
  await updateRedis(log);
  setTimeout(() => updateCache(), 1 * 7 * 1000);
}

updateCache();
// setInterval(() => updateMongo(300), 1 * 60 * 1000)

// SERVER APP
const app = express().use(helmet())
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// Middleware
app.use(require("webpack-dev-middleware")(compiler, {
  noInfo: true,
  publicPath: webpackConfig.output.publicPath,
  quiet: true,
  hot: false,
  inline: false,
  overlay: false,
}));
app.use(webpackMiddleWare);
app.use(cors({
  origin: '*',
  credentials: false,
  content: '*',
  optionsSuccessStatus: 200,
  methods: '*',
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//BlockExplorer - return react app
app.get(["/explorer/*", '/explorer/'], (req, res, next) => {
  res.set('content-type', 'text/html')
  res.send(fs.readFileSync(path.join(__dirname, '/dist/index.html')));
});
app.get('/', (req, res) => { res.redirect('explorer/overview/') });
app.post('/auth', (req, res) => {
  var pwd = req.body.pwd;
  var json_data = {
      "status":'ok',
      "result":'',
  };

  // if (pwd !== 'Does Alice owe Bob 1 Million DAPS?')
  //   json_data['status'] = 'fail';

  res.send(json_data);
});


// chaincoinapi - get data direct from wallet
chaincoinapi.setWalletDetails(settings.wallet);
if (settings.heavy != true) {
  chaincoinapi.setAccess('only', ['getinfo', 'getnetworkhashps', 'getmininginfo', 'getdifficulty', 'getconnectioncount',
    'getmasternodecount', 'getcurrentseesawreward', 'getmasternodecountonline', 'getmasternodelist', 'getvotelist', 'getblockcount', 'getblockhash', 'getblock', 'getrawtransaction',
    'getpeerinfo', 'gettxoutsetinfo', 'getseesawrewardwithheight', 'getseesawrewardratio']);
  chaincoinapi.setAccess('only', ['getinfo', 'getstakinginfo', 'getnetworkhashps', 'getdifficulty', 'getconnectioncount',
    'getmasternodecount', 'getcurrentseesawreward', 'getseesawrewardratio', 'getmasternodecountonline', 'getmasternodelist', 'getvotelist', 'getblockcount', 'getblockhash',
    'getblock', 'getrawtransaction', 'getmaxmoney', 'getvote', 'getmaxvote', 'getphase', 'getreward', 'getpeerinfo',
    'getnextrewardestimate', 'getnextrewardwhenstr', 'getnextrewardwhensec', 'getsupply', 'gettxoutsetinfo', 'getseesawrewardwithheight']);
}

// routes

app.use('/api', chaincoinapi.app); // chaincoinapi - get data direct from wallet

app.use('/dapsapi/', (req, res, next) => { dapsapi(req, res, next) })


// locals
app.set('title', settings.title);
app.set('symbol', settings.symbol);
app.set('coin', settings.coin);
// app.set('locale', locale);
app.set('display', settings.display);
app.set('markets', settings.markets);
app.set('twitter', settings.twitter);
app.set('facebook', settings.facebook);
app.set('googleplus', settings.googleplus);
app.set('bitcointalk', settings.bitcointalk);
app.set('slack', settings.slack);
app.set('github', settings.github);
app.set('discord', settings.discord);
app.set('website', settings.website);
app.set('genesis_block', settings.genesis_block);
app.set('index', settings.index);
app.set('heavy', settings.heavy);
app.set('txcount', settings.txcount);
app.set('nethash', settings.nethash);
app.set('nethash_units', settings.nethash_units);
app.set('show_sent_received', settings.show_sent_received);
app.set('logo', settings.logo);
app.set('theme', settings.theme);
app.set('labels', settings.labels);
app.use(favicon(path.join(__dirname, 'src/assets/images/favicon.ico')));




server.listen(settings.port, (err) => console.log((!err) ?
  chalk.green("Server Listening on: ") + chalk.yellow(settings.port)
  : chalk.red("Server error: ") + err));


io.on('connection', (client) => {
    broadcaststats =  async () => {
      try {
        let prevblockcount, prevsupply, prevdifficulty, prevhashrate, prevmasternoderewardratio, prevconnections, prevmaxmasternodeconnections, prevlastpoablock;
        let blockcount = await uredis.client.get('blockcount');
        let supply = await uredis.client.get('supply');
        let difficulty = await uredis.client.get('difficulty');
        let hashrate = await uredis.client.get('hashrate');
        let connections = await uredis.client.get('connections');
        let lastpoablock = await uredis.client.get('lastpoablock');
        let maxmasternodeconnections = await uredis.client.get('maxmasternodeconnections');
        let masternoderewardratio = await uredis.client.get('masternoderewardratio');

        if (prevblockcount != blockcount || prevsupply != supply || prevdifficulty != difficulty || prevhashrate != hashrate || connections != connections) {
          let blockstats = {
            "blockcount": blockcount,
            "supply": supply,
            "difficulty": difficulty,
            "hashrate": hashrate,
            "connections": connections
          }
          io.emit('blockstats', blockstats);
        }

        if (prevlastpoablock != lastpoablock || prevmaxmasternodeconnections != maxmasternodeconnections || prevconnections != connections ) {
          let networkstats = {
            "lastpoablock": lastpoablock,
            "nodes": connections,
            "masternodes": maxmasternodeconnections,
          }
          io.emit('networkstats', networkstats);
        }
        
        if (prevmasternoderewardratio != masternoderewardratio || prevmaxmasternodeconnections != masternodeconnections) {
          let rewardstats = {
            masternoderewardratio: masternoderewardratio,
            masternodeconnections: maxmasternodeconnections
          }
          io.emit('rewardstats', rewardstats);
        }
        prevblockcount = blockcount;
        prevsupply = supply;
        prevdifficulty = difficulty;
        prevhashrate = hashrate;
        prevconnections = connections;
        prevlastpoablock = lastpoablock;
        prevmaxmasternodeconnections = maxmasternodeconnections;
        prevmasternoderewardratio = masternoderewardratio;
      } catch (err) { 
        console.error(err); 
      }
    }
    broadcaststats();
    setInterval(broadcaststats, 7000);
});

console.log(express().get('labels'))

module.exports = app;
