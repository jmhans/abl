let mongoose = require('mongoose') 
let AblTeam = require('./owner').AblTeam;

var playerGameSchema = new mongoose.Schema()

var playerSchema = new mongoose.Schema({
  name: {type: String, required: false}, 
  mlbID: {type: String, required: true}, 
  position: {type: String, required: false},
  commish_position: {type: String, required: false}, 
  team:{type: String, required: false}, 
  status:{type: String, required: false}, 
  stats: {type: mongoose.Schema.Types.Mixed, required: false},
  ablstatus: {ablTeam: {type: mongoose.Schema.Types.ObjectId, ref:'AblTeam', required: false},
              acqType: {type: String, required: true, default: 'draft'}
             },
//   games: [ {
//     gameDate: {type: String, required: true}, 
//     gamePk: {type: String, required: true}, 
//     stats: {type: mongoose.Schema.Types.Mixed, required: false}, 
//     positions: {type: [], required: false}
//   }], 
  lastUpdate: {type: String, required: false}, 
  //positionLog: {type: [String], required: false}
})

module.exports = {Player: mongoose.model('Player', playerSchema), 
                  PlayerSchema: playerSchema};
