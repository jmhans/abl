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

var ablTeamSchema = new Schema({
  nickname: {type: String, required: true}, 
  location: {type: String, required: true},
  owner: {type: Schema.Types.ObjectId, ref: 'Owner' , required: true},
  stadium: {type: String, required: false}
})

const Team = mongoose.model('Team', teamSchema);
const Owner = mongoose.model('Owner', ownerSchema);
const AblTeam = mongoose.model('AblTeam', ablTeamSchema);

module.exports = {Owner: Owner, 
                  Team: Team, 
                  AblTeam: AblTeam
                 };

