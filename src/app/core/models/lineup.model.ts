
interface Roster {
  player: string
  lineupPosition: string
  rosterOrder: number
  originalPosition? : string
}

class LineupModel {
  constructor(
    public ablTeam: object, 
    public roster: Roster[], 
    public effectiveDate: Date, 
    public priorRosters?: object[], 
    public _id?: string
  ) { }
}

class LineupAddPlayerModel {
  constructor(
    public player: object, 
    public ablTeamId: string 
  ) { }
}

 

export { LineupModel, LineupAddPlayerModel, Roster };