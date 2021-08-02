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
  abl_runs : number
  abl_points : number
  e : number
  ab : number
  g : number
  h : number
  hr : number
  bb : number
  hbp : number
  sac : number
  sf : number
  sb : number
  cs : number
}

interface rosterGameScoreRecord {
  regulation: rosterScoreRecord
  final: rosterScoreRecord
}

interface gameRosters {
  away_score: rosterGameScoreRecord
  home_score: rosterGameScoreRecord
  awayTeam: playerModel[]
  homeTeam: playerModel[]
  status: string
  result: {winner: {}, loser: {}}
}


interface playerModel {
  player?: {}
  lineupPosition?: string
  rosterOrder?: Number
  dailyStats?: {}
  gameStatus?: {}
  playedPosition?: string
  ablstatus?: string
  ablPlayedType?: string
  ablRosterPosition?: Number
  lineupOrder?: Number
}

export { RosterRecordModel, CreateRosterRecordModel, rosterScoreRecord, rosterGameScoreRecord, gameRosters, playerModel };