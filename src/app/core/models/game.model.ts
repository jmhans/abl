import { AblTeamModel } from './abl.team.model'
import { Roster } from './lineup.model'

class GameModel {
    constructor(
    public gameDate: string,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel,
    public description?: string,
    public _id?: string,
    public awayTeamRoster?: Roster[], 
    public homeTeamRoster?: Roster[]
  ) { }
}

class FormGameModel {
  constructor(
    public gameDate: string,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel, 
    public description?: string
  ) { }
}

export { GameModel, FormGameModel  };