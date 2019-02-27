class MlbGameModel {
    constructor(
    public gamePk: Number,
    public gameType: string,
    public season: Date,
    public gameDate: Date,
    public teams: Object,
    public gameNumber: Number,
    public doubleHeader: string,
     public gamedayType: string, 
     public tiebreaker: string, 
     public calendarEventID: string, 
     public seasonDisplay: string, 
     public dayNight: string, 
     public description: string, 
     public scheduledInnings: Number, 
     public gamesInSeries: Number, 
     public seriesGameNumber: Number, 
     public seriesDescription: string, 
     public recordSource: string, 
     public ifNecessary: string, 
     public ifNecessaryDescription: string
  ) { }
}

class FormGameModel {
  constructor(
    public title: string,
    public location: string,
    public startDate: string,
    public startTime: string,
    public endDate: string,
    public endTime: string,
    public viewPublic: boolean,
    public description?: string
  ) { }
}

export { MlbGameModel, FormGameModel };


