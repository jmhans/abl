let mongoose = require('mongoose') 
const Schema = mongoose.Schema;

var teamSchema = new Schema({
  name: {type: String, required: false}
})

var ownerSchema = new Schema({
  name: {type: String, required: true}, 
  email: {type: String, required: false},
  teams: {type: [teamSchema], required: false}
})

const Team = mongoose.model('Team', teamSchema);
const Owner = mongoose.model('Owner', ownerSchema);

module.exports = {Owner: Owner, 
                  Team: Team
                 };
