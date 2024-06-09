let mongoose = require('mongoose')
let AblTeam = require('./owner').AblTeam;

let ablTeamSchema = require('./owner').ablTeamSchema;

const EventEmitter = require('events');
const PlayerStream = new EventEmitter();
const SSE =require('./../controllers/sse.controller');

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
              acqType: {type: String, required: false},
              onRoster: {type: Boolean, required: true, default: false}
             },
//   games: [ {
//     gameDate: {type: String, required: true},
//     gamePk: {type: String, required: true},
//     stats: {type: mongoose.Schema.Types.Mixed, required: false},
//     positions: {type: [], required: false}
//   }],
  lastUpdate: {type: Date, required: false, default: Date.now()},
  statUpdate: {type: Date, required: false},
  lastStatUpdate: {type: Date, required: false},
  //positionLog: {type: [String], required: false}
  dougstatsName: {type: String, required: false}
})

var playerViewSchema = new mongoose.Schema({
  name: {type: String, required: false},
  mlbID: {type: String, required: true},
  position: {type: String, required: false},
  commish_position: {type: String, required: false},
  team:{type: String, required: false},
  status:{type: String, required: false},
  stats: {type: mongoose.Schema.Types.Mixed, required: false},
  ablstatus: {ablTeam: {type: ablTeamSchema, required: false}, //ABlTeam
              acqType: {type: String, required: false},
              onRoster: {type: Boolean, required: true, default: false}
             },

  lastUpdate: {type: Date, required: false, default: Date.now()},
  statUpdate: {type: Date, required: false},
  lastStatUpdate: {type: Date, required: false},
  //positionLog: {type: [String], required: false}
  dougstatsName: {type: String, required: false},
  eligible:{type: [String], required: false}
})

var playerNamesViewSchema = new mongoose.Schema({
  name: {type: String, required: false},
  mlbID: {type: String, required: true},
  team:{type: String, required: false},
  status:{type: String, required: false},
  stats: {type: mongoose.Schema.Types.Mixed, required: false},
  ablstatus: {ablTeam: {type: ablTeamSchema, required: false}, //ABlTeam
              acqType: {type: String, required: false},
              onRoster: {type: Boolean, required: true, default: false}
             },

  lastUpdate: {type: Date, required: false, default: Date.now()},
  lastStatUpdate: {type: Date, required: false},
  //positionLog: {type: [String], required: false}
})

var playerPositionsViewSchema = new mongoose.Schema({
  name: {type: String, required: false},
  mlbID: {type: String, required: true},
   lastStatUpdate: {type: Date, required: false},
  eligible: {type: [String], required: false}
})



playerSchema.pre('save', function preSave(next){
  var plyr = this;
  plyr.lastUpdate = Date.now();
  next();
});

playerSchema.post('save', function(doc, next) {
 // PlayerStream.emit('push', 'message', {msg: 'Player updated', player: doc});
  SSE.emit('push', 'player', {msg: 'Player updated', player: doc})
  next()
})




module.exports = {Player: mongoose.model('Player', playerSchema),
                  PlayerSchema: playerSchema,
                PlayerStream: PlayerStream,
                PlayerView: mongoose.model('players_view', playerViewSchema, 'players_view'),
                PlayerCache: mongoose.model('players_cache', playerViewSchema, 'players_cache'),
                PlayerNamesView: mongoose.model('player_names_view', playerNamesViewSchema, 'player_names_view'),
                PlayerPositionsView: mongoose.model('positions_view', playerPositionsViewSchema, 'positions_view')
              };
