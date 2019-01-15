let mongoose = require('mongoose') 

var playerSchema = new mongoose.Schema({
  name: {type: String, required: true}, 
  mlbID: {type: String, required: true}
})

module.exports = mongoose.model('Player', playerSchema);
