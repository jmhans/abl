import { AblTeamModel } from './abl.team.model'
import { Roster, PopulatedRoster } from './lineup.model'

class GameModel {
    constructor(
    public gameDate: string,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel,
    public description?: string,
    public _id?: string,
    public awayTeamRoster?: Roster[], 
    public homeTeamRoster?: Roster[],
    public attestations?: any[],
    public results?: GameResultsModel
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

interface PopulatedGameModel {
    gameDate: string
    awayTeam: AblTeamModel
    homeTeam: AblTeamModel
    description?: string
    _id?: string
    awayTeamRoster?: PopulatedRoster[] 
    homeTeamRoster?: PopulatedRoster[]
    status: any
}
interface GameResultsModel  {
        status: string
        scores: {team: string, location: string, regulation: {}, final: {}  }[] 
        winner: {} 
        loser: {}
        attestations: {attester: string, time: Date}[]
      }


export { GameModel, FormGameModel, PopulatedGameModel, GameResultsModel  };