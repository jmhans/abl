let mongoose = require('mongoose')

var draftSchema = new mongoose.Schema()
let Player = require('./player').Player;
let AblTeam = require('./owner').AblTeam;


var draftSchema = new mongoose.Schema({
  season: {type: String, required: true},
  order:[{ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: false}}],
  rounds:{type: Number, required: true}
})

var draftPickSchema = new mongoose.Schema({
  season: {type: String, required: true},
  pickNumber: {type: Number, required: false},
  player: {type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true},
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: true},
  pickTime: {type: Date, required: false}
})



module.exports = {Draft: mongoose.model('Draft', draftSchema),
                  draftSchema: draftSchema,
                 DraftPick: mongoose.model('Draftpick', draftPickSchema)};
