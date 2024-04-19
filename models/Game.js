const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let AblTeam = require('./owner').AblTeam;
let ablTeamSchema = require('./owner').ablTeamSchema;
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
  gameType: {type: String, required: false},
  description: String,
  awayTeamRoster: [{type: gamePlayerSchema}],
  homeTeamRoster: [{type: gamePlayerSchema}],
  awayScore: { type: Number, required: false},
  homeScore: { type: Number, required: false},
  winner: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false},
  loser: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false},
  active: [{type: gamePlayerSchema}],
  status: String,
  results: [{
        status: String,
        scores: [{team: String, location: String, regulation: {}, final: {}  , players: Array}] ,
        winner: {type: Schema.Types.ObjectId, ref: 'AblTeam', required: false},
        loser: {type: Schema.Types.ObjectId, ref: 'AblTeam', required: false},
        attestations: [{attester: String, attesterType: String, time: Date}]
      }]

});

const gameResultsViewSchema = new Schema({
  gameDate: { type: Date, required: true },
  awayTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true},
  homeTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true},
  gameType: {type: String, required: false},
  description: String,

  status: String,
  results: [{
        status: String,
        scores: [{team: String, location: String, final: {} }] ,
        winner: {type: Schema.Types.ObjectId, ref: 'AblTeam', required: false},
        loser: {type: Schema.Types.ObjectId, ref: 'AblTeam', required: false},
        attestations: [{attester: String, attesterType: String, time: Date}]
      }]

});

module.exports = {Game:mongoose.model('Game', gameSchema),
GameResultsView: mongoose.model('gameResultsView', gameResultsViewSchema, 'gameResultsView')

}

