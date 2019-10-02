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
exports.endpoint = process.env.ENDPOINT || settings.endpoint;

// logo
exports.logo = "/images/logo.png";


//The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = "favicon.ico";

//The Port ep-lite should listen to
exports.port =  process.env.PORT||settings.port;

//Locale file
exports.locale = "locale/en.json"
