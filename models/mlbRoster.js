let mongoose = require('mongoose')

var mlbRosterSchema = new mongoose.Schema({
  copyright: {type: String, required: false},
  roster: {type: [{
    person: {type: {id: Number, fullName: String, link: String }, required: true},
    jerseyNumber: Number,
    position: {type: {code: Number, name: String, type: String, abbreviation: String}},
    status: {type: {code: String, description: String}},
    parentTeamId: Number
  }], required: true},
team: {type: {}, required: false},
teamId: {type: Number, required: true},
rosterType: {type: String, required: false},
link: {type: String, required: false}
})

mlbRosterSchema.post('save', function(doc, next) {
// update player statuses.

 for (var p=0; p<doc.roster.length; p++) {
  const plyr = this.PlyrCntl._updatePlayerStatus(doc.roster[p], doc.team); // appendPlayerRecord(player, team, gm);
 }

})



module.exports = mongoose.model('mlbRoster', mlbRosterSchema);
