class GameModel {
    constructor(
    public gameDate: Date,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel,
    public description?: string,
    public _id?: string,
  ) { }
}

class AblTeamModel {
  constructor(
  public name: string, 
  public location: string, 
  public stadium: string, 
  public owner: string, 
  public _id?: string, 
  ) { }
}

export { GameModel, AblTeamModel };