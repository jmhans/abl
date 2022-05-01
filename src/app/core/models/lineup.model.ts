import { MlbPlayerModel } from './mlb.player.model'

interface Roster {
  player: MlbPlayerModel
  lineupPosition: string
  rosterOrder: number
  originalPosition? : string
}

class LineupModel {
  constructor(
    public _id: string,
    public ablTeam: object,
    public roster: Roster[],
    public effectiveDate: Date
  ) { }
}

class LineupCollectionModel {
    constructor(
    public _id: string,
    public ablTeam: object,
    public roster: Roster[],
    public effectiveDate: Date,
    public priorRosters?: LineupModel[]
  ) { }
}

class LineupFormModel {
    constructor(
    public lineupId: string,
    public rosterId: string,
    public roster: Roster[],
    public effectiveDate: Date
  ) { }
}


class LineupAddPlayerModel {
  constructor(
    public player: object,
    public ablTeamId: string
  ) { }
}

interface PopulatedRoster {
  player: object
  lineupPosition: string
  rosterOrder: number
  originalPosition?: string
}

interface SubmitLineup {
  _id?: string;
  effectiveDate: Date;
  roster: [{
    "_id": string;
    "player": string;
    "lineupPosition": string;
    "rosterOrder": number;
           }];

}


export { LineupModel, LineupAddPlayerModel, Roster, PopulatedRoster, SubmitLineup , LineupCollectionModel, LineupFormModel};
