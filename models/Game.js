const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let AblTeam = require('./owner').AblTeam;
let Player = require('./player').Player;


const gamePlayerSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player'}, 
  lineupPosition: {type: String}, 
  rosterOrder: {type: Number},
  playedPosition: {type: String, default: "BENCH"},
  box: {type: Schema.Types.Mixed}
})


const gameSchema = new Schema({
  gameDate: { type: Date, required: true },
  awayTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true}, 
  homeTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true}, 
  description: String,
  awayTeamRoster: [{type: gamePlayerSchema}], 
  homeTeamRoster: [{type: gamePlayerSchema}],
  awayScore: { type: Number, required: false},
  homeScore: { type: Number, required: false},
  winner: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false}, 
  loser: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false},
  active: [{type: gamePlayerSchema}], 
  status: String, 
  results: {}
                              
});

module.exports = mongoose.model('Game', gameSchema);

