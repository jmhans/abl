let mongoose = require('mongoose') 

var ownerSchema = new mongoose.Schema({
  name: {type: String, required: true}, 
  email: {type: String, required: false}
})

module.exports = mongoose.model('Owner', ownerSchema);
