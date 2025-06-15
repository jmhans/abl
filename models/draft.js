let mongoose = require('mongoose')
const SSE =require('../controllers/sse.controller');

var draftSchema = new mongoose.Schema()

//let Player = require('./player').PlayerView;
let AblTeam = require('./owner').AblTeam;
let Player = require('./player').Player;



var draftSchema = new mongoose.Schema({
  season: {type: String, required: true},
  order:[{ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: false}}],
  rounds:{type: Number, required: true}
})

var draftPickSchema = new mongoose.Schema({
  season: {type: String, required: true},
  pickNumber: {type: Number, required: false},
  player: {type: mongoose.Schema.Types.ObjectId, ref: 'players_view', required: false},
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: true},
  pickTime: {type: Date, required: false},
  draftType: {type: String, required: false, default: 'draft'  },
  round: {type: Number, required: false},
  pickInRound: {type: Number, required: false},
  status: {type: String, required: false}
})



var skipPicks = new mongoose.Schema({
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: true}
})

skipPicks.post('save', function(doc) {
  console.log('%s has been saved', doc._id);
  SSE.emit('push', 'skips', {msg: 'new skip saved!'})

});
var drop = new mongoose.Schema({
  ablTeam: {type: mongoose.Schema.Types.ObjectId, ref: 'AblTeam', required: true},
  player: {type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true}
})

drop.post('save', function(doc) {
  console.log('%s has been saved', doc._id);
  SSE.emit('push', 'skips', {msg: 'new skip saved!'})

});



module.exports = {Draft: mongoose.model('Draft', draftSchema),
                  draftSchema: draftSchema,
                 DraftPick: mongoose.model('Draftpick', draftPickSchema),
                Skip: mongoose.model('Skip', skipPicks),
                Drop: mongoose.model('Drop', drop)
              };
