let mongoose = require('mongoose') 

var ownerSchema = new mongoose.Schema({
  name: {type: String, required: true}
})

module.exports = mongoose.model('Owner', ownerSchema);
