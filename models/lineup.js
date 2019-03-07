let mongoose = require('mongoose');
let AblTeam = require('./owner').AblTeam;
let Player = require('./player').Player;

const Schema = mongoose.Schema;

var lineupSchema = new Schema({
  ablTeam: {type: Schema.Types.ObjectId, ref:'AblTeam', required: true},
  roster: [{
    player: {type: Schema.Types.ObjectId, ref:'Player'}, 
    lineupPosition: {type: String}, 
    rosterOrder: {type: Number}
  }], 
  effectiveDate: {type: Date}, 
  priorRosters: [{
    effectiveDate: {type: Date}, 
    roster: [{
      player: {type: Schema.Types.ObjectId, ref:'Player'}, 
      lineupPosition: {type: String}, 
      rosterOrder: {type: Number}
    }]  
  }]
})


const Lineup = mongoose.model('Lineup', lineupSchema);

module.exports = { Lineup: Lineup };