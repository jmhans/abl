let mongoose = require('mongoose');
let Player = require('./player').Player;

const Schema = mongoose.Schema;

var statLineSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player', required: false}, 
  mlbId: {type: String, required: true}, 
  gameDate: {type: String, required: true}, 
  gamePk: {type: String, required: false}, 
  stats: {type: Schema.Types.Mixed, required: false},
  positions: [{type: String, required: false}]
  
})


const Statline = mongoose.model('Statline', statLineSchema);

module.exports =  Statline ;