let mongoose = require('mongoose') 

var ownerSchema = new mongoose.Schema({
  name: String
})

module.exports = mongoose.model('Owner', ownerSchema);
