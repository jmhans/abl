import { MlbPlayerModel } from './mlb.player.model'

// interface Roster {
//   player: MlbPlayerModel
//   lineupPosition: string
//   rosterOrder: number
//   originalPosition? : string
//   changed? : Boolean
//   latest40Man?: Date
// }

class Roster {
  public originalPosition: string;
  public originalRosterOrder: number;

  constructor(
    public player: MlbPlayerModel,
    public lineupPosition: string,
    public rosterOrder: number,
    public latest40Man?: Date
  ){
    this.originalPosition = lineupPosition
    //this.originalRosterOrder =rosterOrder

  }
  get changed() {
    return this.lineupPosition != this.originalPosition
  }



}


class LineupModel {
  constructor(
    public _id: string,
    public ablTeam: object,
    public roster: Roster[],
    public effectiveDate: Date,
    public latest40Man?: Date
  ) { }
}

class LineupCollectionModel {
    constructor(
    public _id: string,
    public ablTeam: object,
    public roster: Roster[],
    public effectiveDate: Date,
    public priorRosters?: LineupModel[],
    public latest40Man?: Date
  ) { }
}

class LineupFormModel {
    constructor(
    public lineupId: string,
    public rosterId: string,
    public roster: Roster[],
    public effectiveDate: Date,
    public latest40Man?: Date
  ) { }
  get changed() {
    const unchanged = this.roster.every((r)=> !r.changed && this.roster.indexOf(r) == (r.rosterOrder -1))
    return !unchanged
  }
  recalcOrder() {
    for (let rr=0; rr<this.roster.length; rr++) {
      this.roster[rr].rosterOrder = rr + 1
    }
  }

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
