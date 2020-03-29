let mongoose = require('mongoose');
let Player = require('./player').Player;
let Game = require('./Game');

const Schema = mongoose.Schema;

var statLineSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player', required: false}, 
  mlbId: {type: String, required: true}, 
  gameDate: {type: Date, required: true}, 
  gamePk: {type: String, required: false}, 
  stats: {type: Schema.Types.Mixed, required: false},
  positions: [{type: String, required: false}],
  ablGame: {type: Schema.Types.ObjectId, ref: 'Game', required: false}
})


const Statline = mongoose.model('Statline', statLineSchema);

module.exports =  Statline ;