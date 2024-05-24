const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statline = require('./statline.js').StatlineSchema



const mlbGameSchema = new Schema({
  gamePk: {type: Number, required: true},
  gameType: { type: String, required: true},
  season: {type: String},
  gameDate: { type: String, required: true},
  officialDate: { type: String, required: false},
  rescheduleDate: { type: String, required: false},
  teams: {type: Schema.Types.Mixed, required: true},
  resumedFrom: {type: String, required: false},
  //gameNumber: {type:Number},
  //doubleHeader: {type:String},
  //gamedayType: {type:String},
  //tiebreaker: {type:String},
  //calendarEventID: {type:String},
  //seasonDisplay: {type:String},
  //dayNight: {type:String},
  description: {type:String},
  //scheduledInnings: {type:Number},
  //gamesInSeries: {type:Number},
  //seriesGameNumber: {type:Number},
  seriesDescription: {type:String},
  //recordSource: {type:String},
  ifNecessary: {type:String},
 // ifNecessaryDescripton: {type:String},
  status: {type:Schema.Types.Mixed, required: true},
  rescheduledDate: {type: String, required: false}

});


const mlbGameLoadSchema = new Schema({
  gamePk: {type: Number, required: true},
  gameType: { type: String, required: true},
  season: {type: String},
  gameDate: { type: String, required: true},
  resumedFrom: {type: String, required: false},
  officialDate: { type: String, required: false},
  rescheduleDate: { type: String, required: false},
  teams: {type: Schema.Types.Mixed, required: true},
  description: {type:String},
  seriesDescription: {type:String},
  ifNecessary: {type:String},
  status: {type:Schema.Types.Mixed, required: true},
  rescheduledDate: {type: String, required: false},
  stats: {type: [statline], required: false}

});


module.exports = {mlbGame: mongoose.model('mlbGameSchema', mlbGameSchema)
,mlbGameLoad: mongoose.model('mlbGameLoads', mlbGameLoadSchema, 'mlbGameLoads')
}


