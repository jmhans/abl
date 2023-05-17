const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let ablTeamSchema = require('./owner').ablTeamSchema;
let AblTeam = require('./owner').AblTeam;


const outcomeSchema =  new Schema({
  outcome: {type: String},
  gameDate: {type: Date}
})

const advancedStandingSchema = new Schema({
  rec: [{t2: String,
          w: Number}],
  avgW: Number,
  avgL: Number
})


const standingSchema = new Schema({
  outcomes: {type: [outcomeSchema]},
  w: {type: Number},
  l: {type: Number},
  abl_runs: {type: Number},
  avg_runs: {type: Number},
  ab: {type: Number},
  h: {type: Number},
  '2b': {type: Number},
  '3b': {type: Number},
  hr: {type: Number},
  bb: {type: Number},
  hbp: {type: Number},
  e: {type: Number},
  sb: {type: Number},
  sac: {type: Number},
  sf: {type: Number},
  era: {type: Number},
  hr_allowed: {type: Number},
  g: {type: Number},
  win_pct: {type: Number},
  tm: {type: ablTeamSchema, required: false},
  l10: {type: {w: {type: Number}, l: {type: Number}}},
  streak: {type: { strType: {type: String}, count: {type: Number}, active: {type: Boolean} }},
  AdvancedStandings: {type: advancedStandingSchema, required: false }
})


module.exports = mongoose.model('standings_view', standingSchema, 'standings_view');

