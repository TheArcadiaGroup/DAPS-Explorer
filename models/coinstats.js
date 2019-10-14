var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  ,mongooseAggregatePaginate = require('mongoose-aggregate-paginate-allowdiskuse');
 
var CoinStatsSchema = new Schema({
  coin: { type: String },
  blockcount: { type: Number, default: -1 },
  difficulty: { type: String, default: "0" },
  hashrate: { type: String, default: 'N/A' },
  supply: { type: String, default: "0" },
  connections: {type: Number, default: 0},
  masternodeconnections: {type: Number, default: 0}
});

CoinStatsSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('coinstats', CoinStatsSchema);