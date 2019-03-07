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

 

export { RosterRecordModel, CreateRosterRecordModel };