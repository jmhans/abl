
export class MLBTeam {
  leagueRecord: {
      wins: number;
      losses: number;
      pct: string;
    };
  team: {
      id: number;
      name: string;
      link: string;
    };
  splitSquad: boolean;
  seriesNumber: number;

}
export class MLBGame {
  gamePk: number;
  link: string;
  gameType: string;
  season: string;
  gameDate: string;
  rescheduleDate: string;
  status: {
    abstractGameState: string;
    codedGameState: string;
    detailedState: string;
    statusCode: string;
    reason: string;
    abstractGameCode: string;
          };
  teams: {away: MLBTeam;
          home: MLBTeam;
         };
  venue: { id: number; name: string; link: string};
  content: { link: string;};
  gameNumber: number;
  doubleHeader: string;
  gamedayType: string;
  tiebreaker: string;
  calendarEventID: string;
  seasonDisplay: string;
  dayNight: string;
  description: string;
  scheduledInnings: number;
  gamesInSeries: number;
  seriesGameNumber: number;
  seriesDescription: string;
  recordSource: string;
  ifNecessary: string;
  ifNecessaryDescripton: string;
}
export class MLBDateObj {
  date: string;
  totalItems: number;
  totalEvents: number;
  totalGames: number;
  totalGamesInProgress: number;
  games: MLBGame[];
  events: [];
}
export class MLBSchedule {
  copyright : string;
  totalItems : number;
  totalEvents : number;
  totalGames : number;
  totalGamesInProgress : number;
  dates : MLBDateObj[]; 
}
  
  