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

var rosterRecordSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player', required: true},
  rosterPosition: {type: String, required: true},
  rosterOrder: {type: Number, required: true},
  ablTeam: {type: Schema.Types.ObjectId, ref:'AblTeam', required: false},
  startDatetime: {type: Date, required: true},
  active: {type: Boolean, required: false}
})

var ablTeamSchema = new Schema({
  nickname: {type: String, required: true},
  location: {type: String, required: false},
  stadium: {type: String, required: false},
  userId: {type: String, required: false},
  owners: [{ userId: {type: String, required: false} , name: {type: String, required: false }, email: {type: String, required: false}, verified: {type: Boolean, required: true}}]
})


const Team = mongoose.model('Team', teamSchema);
const Owner = mongoose.model('Owner', ownerSchema);
const AblTeam = mongoose.model('AblTeam', ablTeamSchema);
const AblRosterRecord = mongoose.model('AblRosterRecord', rosterRecordSchema);

module.exports = {Owner: Owner,
                  Team: Team,
                  AblTeam: AblTeam,
                  AblRosterRecord: AblRosterRecord,
                  ablTeamSchema: ablTeamSchema
                 };

