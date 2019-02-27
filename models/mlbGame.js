const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mlbGameSchema = new Schema({
  gamePk: {type: Number, required: true}, 
  gameType: { type: String, required: true}, 
  season: {type: String}, 
  gameDate: { type: String, required: true}, 
  teams: {type: Schema.Types.Mixed, required: true},
  gameNumber: {type:Number},
  doubleHeader: {type:String},
  gamedayType: {type:String},
  tiebreaker: {type:String},
  calendarEventID: {type:String},
  seasonDisplay: {type:String},
  dayNight: {type:String},
  description: {type:String},
  scheduledInnings: {type:Number},
  gamesInSeries: {type:Number},
  seriesGameNumber: {type:Number},
  seriesDescription: {type:String},
  recordSource: {type:String},
  ifNecessary: {type:String},
  ifNecessaryDescripton: {type:String},
  status: {type:Schema.Types.Mixed, required: true},
  rescheduledDate: {type: String, required: false}

});

module.exports = mongoose.model('mlbGameSchema', mlbGameSchema);


