//This setting is passed to MongoDB to set up the database
exports.dbsettings = {
  "user": "bilbo",
  "password": "baggins",
  "database": "daps99",
  "address": "localhost",
  "port": 27017
};

//This setting is passed to the wallet
exports.wallet = {
  "host": "localhost",
  "port": 53573,
  "user": "bilbo",
  "pass": "baggins"
}

/**
* The Settings Module reads the settings out of settings.json and provides
* this information to the other modules
*/
const settings = require('./serverconfig.json')

//The app title, visible e.g. in the browser window
exports.title = "explorer.example.com";

//The url it will be accessed from
exports.address = process.env.SERVER_ADDRESS || settings.address || 'localhost';
//The Url
exports.endpoint = process.env.ENDPOINT || settings.endpoint

// logo
exports.logo = "/images/logo.png";


//The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = "favicon.ico";

//The Port ep-lite should listen to
exports.port =  process.env.PORT||settings.port


//coin symbol, visible e.g. MAX, LTC, HVC
exports.symbol = "CHC";


//coin name, visible e.g. in the browser window
exports.coin = "DAPS";

//Locale file
exports.locale = "locale/en.json",

exports.masternodecachecount = 60 * 4;

//Menu items to display
exports.display = {
  "api": true,
  "market": true,
  "twitter": true,
  "facebook": false,
  "googleplus": false,
  "bitcointalk": false,
  "website": false,
  "slack": false,
  "github": false,
  "discord": false,
  "search": true,
  "richlist": true,
  "movement": true,
  "network": true
};


//API view
exports.api = settings.api || {
  "blockindex": 1337,
  "blockhash": "00000000001b8c30360db57b575b3c2bf668b0ed50683f567afd47ae1773efb8",
  "txhash": "285feead54e322aa69f649c4078766171df358a12f5f1517d61f303780e25511",
  "address": "CaxX1HVWzbQ516w61XbtHR63vNmp2mvLMZ"
},

// markets
exports.markets = {
  "coin": "CHC",
  "exchange": "BTC",
  "enabled": ['cryptopia'],
  "cryptopia_id": "2186",
  "default": "cryptopia"
};
// richlist/top100 settings
exports.richlist = {
  "distribution": true,
  "received": true,
  "balance": true
};

exports.movement = {
  "min_amount": 100,
  "low_flag": 1000,
  "high_flag": 10000
},

exports.peers = {
  "ipstack_api_key": "Your API Key" 
},

//index
exports.index = {
  "show_hashrate": false,
  "difficulty": "POW",
  "last_txs": 100
};

// twitter
exports.twitter = "suprnurd";
exports.facebook = "yourfacebookpage";
exports.googleplus = "yourgooglepluspage";
exports.bitcointalk = "yourbitcointalktopicvalue";
exports.website = "yourcompletewebsiteurlincludingtheprotocol";
exports.slack = "yourcompleteslackinviteurlincludingtheprotocol";
exports.github = "yourgithubaccount/repo";
exports.discord = "invitelink";

exports.confirmations = 6;

//timeouts
exports.update_timeout = 125;
exports.check_timeout = 250;


//genesis
exports.genesis_tx = settings.genesis_tx;
exports.genesis_block = settings.genesis_block;

exports.heavy = false;
exports.txcount = 100;
exports.show_sent_received = true;
exports.supply = "TXOUTSET";
exports.nethash = "getnetworkhashps";
exports.nethash_units = "G";

exports.labels = {};

exports.reloadSettings = function reloadSettings() {
  // Discover where the settings file lives
  var settingsFilename = "settings.json";
  settingsFilename = "./config/" + settingsFilename;

  var settingsStr;
  try{
    //read the settings sync
    settingsStr = fs.readFileSync(settingsFilename).toString();
  } catch(e){
    console.warn('No settings file found. Continuing using defaults!');
  }

  // try to parse the settings
  var settings;
  try {
    if(settingsStr) {
      settingsStr = jsonminify(settingsStr).replace(",]","]").replace(",}","}");
      settings = JSON.parse(settingsStr);
    }
  }catch(e){
    console.error('There was an error processing your settings.json file: '+e.message);
    process.exit(1);
  }

  //loop trough the settings
  for(var i in settings)
  {
    //test if the setting start with a low character
    if(i.charAt(0).search("[a-z]") !== 0)
    {
      console.warn("Settings should start with a low character: '" + i + "'");
    }

    //we know this setting, so we overwrite it
    if(exports[i] !== undefined)
    {
      exports[i] = settings[i];
    }
    //this setting is unkown, output a warning and throw it away
    else
    {
      console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
    }
  }

};

// initially load settings
exports.reloadSettings();

