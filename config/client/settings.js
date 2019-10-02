/**
* The Settings Module reads the settings out of clientconfig.json and provides
* this information to the other modules
*/
const settings = require('./config.json')

//The url it will be accessed from
exports.address = process.env.SERVER_ADDRESS || settings.address || 'localhost';

//The Url
exports.endpoint = process.env.ENDPOINT || settings.endpoint;

//The Port ep-lite should listen to
exports.port =  process.env.PORT||settings.port;
