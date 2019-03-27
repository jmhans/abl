let mongoose = require('mongoose') 
let AblTeam = require('./owner').AblTeam;

var playerGameSchema = new mongoose.Schema()

var playerSchema = new mongoose.Schema({
  name: {type: String, required: false}, 
  mlbID: {type: String, required: true}, 
  position: {type: String, required: false}, 
  team:{type: String, required: false}, 
  status:{type: String, required: false}, 
  stats: {type: mongoose.Schema.Types.Mixed, required: false},
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref:'AblTeam', required: false}, 
  games: [ {
    gameDate: {type: String, required: true}, 
    gamePk: {type: String, required: true}, 
    stats: {type: mongoose.Schema.Types.Mixed, required: false}, 
    positions: {type: [], required: false}
  }], 
  lastUpdate: {type: String, required: false}
})

module.exports = {Player: mongoose.model('Player', playerSchema), 
                  PlayerSchema: playerSchema};
