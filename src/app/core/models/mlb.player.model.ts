
class MlbPlayerModel {
  constructor(
    public name: string,
    public mlbID: string,
    public position: string,
    public commish_position: string,
    public team: string,
    public status: string,
    public stats: {batting: Object, fielding: Object, pitching: Object},
    public games: Object[],
    public positionLog: Object,
    public ablstatus: {onRoster: boolean, ablTeam: Object, acqType: string},
     public eligible: string[],
    public abl_runs?: Number,
     public _id?: string ,
     public draftMe?: boolean,
     public dougstatsName?: string,
     public abl?:Number

  ) { }
}

export { MlbPlayerModel };
