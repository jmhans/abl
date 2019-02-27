let mongoose = require('mongoose') 

var playerSchema = new mongoose.Schema({
  name: {type: String, required: true}, 
  mlbID: {type: String, required: true}, 
  position: {type: String, required: false}, 
  team:{type: String, required: false}, 
  status:{type: String, required: false}, 
  stats: {type: mongoose.Schema.Types.Mixed, required: false}
})

module.exports = mongoose.model('Player', playerSchema);
