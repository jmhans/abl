
class MlbPlayerModel {

  constructor(
    public name: string,
    public mlbID: string,
    public position: string,
    public commish_position: string,
    public team: string,
    public status: string,
    public stats: {batting: {
      hits: number, doubles: number, triples: number, homeRuns: number, baseOnBalls: number, hitByPitch: number,
      atBats: number, stolenBases: number, caughtStealing: number, sacBunts: number, sacFlies: number, intentionalWalks: number, plateAppearances: number, pickoffs:number
    }, fielding: Object, pitching: Object},
    public games: Object[],
    public positionLog: Object,
    public ablstatus: {onRoster: boolean, ablTeam: Object, acqType: string},
     public eligible: string[],
    public abl_runs?: Number,
     public _id?: string ,
     public draftMe?: boolean,
     public dougstatsName?: string,
     public lastUpdate? : Date

  ) {

  }
  get fortyMan() {
    return true
  }
  get abl() {



    if (this.stats && this.stats.batting) {
      let plyrStats = this.stats.batting
      return (plyrStats.hits * 25 +
        plyrStats.doubles * 10 +
              plyrStats.triples * 20 +
              plyrStats.homeRuns * 30 +
              plyrStats.baseOnBalls * 10 +
              plyrStats.hitByPitch * 10 +
              plyrStats.stolenBases * 7 +
              plyrStats.caughtStealing * (-7) +
              plyrStats.pickoffs * (-7) +
              (plyrStats.sacBunts || 0 + plyrStats.sacFlies || 0) * 5) / plyrStats.atBats - 4.5
    } else {
      return -Infinity
    }

  }

}

export { MlbPlayerModel };
