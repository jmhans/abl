let mongoose = require('mongoose') 
let AblTeam = require('./owner').AblTeam;


var playerSchema = new mongoose.Schema({
  name: {type: String, required: true}, 
  mlbID: {type: String, required: true}, 
  position: {type: String, required: false}, 
  team:{type: String, required: false}, 
  status:{type: String, required: false}, 
  stats: {type: mongoose.Schema.Types.Mixed, required: false},
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref:'AblTeam', required: false}
})

module.exports = {Player: mongoose.model('Player', playerSchema), 
                  PlayerSchema: playerSchema};
