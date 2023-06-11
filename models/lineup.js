let mongoose = require('mongoose');
let AblTeam = require('./owner').AblTeam;
let Player = require('./player').Player;
let PlayerSchema = require('./player').PlayerSchema;

const Schema = mongoose.Schema;

var lineupSchema = new Schema({
  ablTeam: {type: Schema.Types.ObjectId, ref:'AblTeam', required: true},
  roster: [{
    player: {type: Schema.Types.ObjectId, ref:'Player'},
    lineupPosition: {type: String},
    rosterOrder: {type: Number},
    dailyStats: {type: {}},
    playedPosition: {type: String},
    ablstatus: {type: String},
    lineupOrder: {type: Number}
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

var lineupQuerySchema = new Schema({
  ablTeam: {type: Schema.Types.ObjectId, required: false},
  effectiveDate: {type: Date, required: false},
  roster: {type:
    [
      {player: {type: PlayerSchema},
      lineupPosition: {type: String},
      rosterOrder: {type: Number}
    }], required: false},
  _id:{type: Schema.Types.ObjectId, required: false}
})


const Lineup = mongoose.model('Lineup', lineupSchema);
const CurrentLineups = mongoose.model('current_lineups', lineupQuerySchema, 'current_lineups');

module.exports = { Lineup: Lineup , CurrentLineups: CurrentLineups};
