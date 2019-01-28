let mongoose = require('mongoose') 

var rosterSchema = new mongoose.Schema({
  teamId: {type: String, required: false}, 
  players: {type: [String], required: false}
  
}, { timestamps: { createdAt: 'created_at' } })

module.exports = mongoose.model('Roster', rosterSchema);