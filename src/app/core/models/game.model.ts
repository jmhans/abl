import { AblTeamModel } from './abl.team.model'
import { Roster, PopulatedRoster } from './lineup.model'
import { rosterGameScoreRecord, rosterScoreRecord , playerModel} from './roster.record.model'


interface IGame {
  gameDate: string;
  awayTeam: AblTeamModel;
  homeTeam: AblTeamModel;
  description?: string;
  _id?: string;
  gameType?: string;
  awayTeamRoster?: Roster[];
  homeTeamRoster?: Roster[];
  results?: GameResultsModel[];
}

class GameClass implements IGame {
  public gameDate: string;
  public awayTeam: AblTeamModel;
  public homeTeam: AblTeamModel;
  public description?: string;
  public _id?: string;
  public gameType?: string;
  public awayTeamRoster?: Roster[];
  public homeTeamRoster?: Roster[];
  public results?: GameResultsModel[];
    constructor(game: IGame) {
      for (let key in game) {
        this[key] = game[key]
      }
    }

  public get summary() {
    return {gameDate: new Date(this.gameDate)
      , status: this.results?.[0]?.status
      , score: {
        home: this.results?.[0]?.scores.find((r)=>{return  r.location=='H'}).final.abl_runs
        , away: this.results?.[0]?.scores.find((r)=>{return  r.location=='A'}).final.abl_runs
      }
      , winner:this.results?.[0]?.winner
      , loser: this.results?.[0]?.loser
      , awayTeam: this.awayTeam.nickname
      , homeTeam: this.homeTeam.nickname
    }
  }
}

class GameModel {

    constructor(
    public gameDate: string,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel,
    public description?: string,
    public _id?: string,
    public gameType?: string,
    public awayTeamRoster?: Roster[],
    public homeTeamRoster?: Roster[],
    public results?: GameResultsModel[]
  ) {

  }

}

class FormGameModel {
  constructor(
    public gameDate: string,
    public awayTeam: AblTeamModel,
    public homeTeam: AblTeamModel,
    public description?: string,
    public gameType?: string
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
    results?: GameResultsModel[]
}

interface gameLineModel {
  abl_runs: number
  g: number
  ab: number
  h: number
//  "2b": number
//  "3b": number
  hr: number
  bb: number
  hbp: number
  sac: number
  sf: number
  sb: number
  cs: number
  po: number
  e: number
  pb: number
  abl_points: number
}



interface GameResultsModel  {
        status: string
        scores: {team: string, location: string, regulation: rosterScoreRecord, final: rosterScoreRecord  , players:  playerModel[]}[]
        winner: {}
        loser: {}
        attestations: {attester: string, attesterType: string, time: Date, _id?: string}[]
        attestation_status?: string
        created_by?: string
        _id?: string
        needsAttest?:boolean
      }

class GameResultForm {
      status: string
      scores: {team: string, location: string, regulation: rosterScoreRecord, final: rosterScoreRecord  , players:  playerModel[]}[]
      winner: {}
      loser: {}
      attestations: {attester: string, attesterType: string, time: Date}[]
      attestation_status: string
      created_by: string
      constructor(
    public result: GameResultsModel
  ) {
      this.status = result.status
      this.scores = result.scores
      this.winner = result.winner
      this.loser = result.loser
      this.attestations = result.attestations
      this.attestation_status = result.attestation_status
      this.created_by = result.created_by

    }
}

class CalendaredGameModel {
  constructor(
    public date:Date,
    public games:GameClass[]
) { }
}



export { GameModel, FormGameModel, PopulatedGameModel, GameResultsModel , GameResultForm, CalendaredGameModel, GameClass};
