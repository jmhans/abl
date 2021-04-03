class RosterRecordModel {
  constructor(
    public player: Object, 
    public rosterPosition: string, 
    public rosterOrder: number, 
    public ablTeam: Object, 
    public startDatetime: Date, 
    public active: boolean, 
    public id?: string
  ) { }
}

class CreateRosterRecordModel {
  constructor(
    public player: Object, 
    public ablTeamId: string 
  ) { }
}

 interface rosterScoreRecord {
  abl_runs : Number
  abl_points : Number
  e : Number
  ab : Number
  g : Number
  h : Number
  hr : Number
  bb : Number
  hbp : Number
  sac : Number
  sf : Number
  sb : Number
  cs : Number
}

interface rosterGameScoreRecord {
  regulation: rosterScoreRecord
  final: rosterScoreRecord
}

interface gameRosters {
  away_score: rosterGameScoreRecord
  home_score: rosterGameScoreRecord
  awayTeam: {}
  homeTeam: {}
  status: string
  result: {winner: {}, loser: {}}
}

export { RosterRecordModel, CreateRosterRecordModel, rosterScoreRecord, rosterGameScoreRecord, gameRosters };