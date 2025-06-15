// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError, map , tap} from 'rxjs/operators';
// import { ENV } from './env.config';
import { EventModel } from './models/event.model';
import { RsvpModel } from './models/rsvp.model';
import { MlbGameModel } from './models/mlbgame.model';
import { GameClass, GameModel } from './models/game.model';
import { AblTeamModel } from './models/abl.team.model';
import { OwnerModel } from './models/owner.model';
import { MlbPlayerModel } from './models/mlb.player.model';
import { MlbRoster } from './models/mlb.roster';
import { LineupModel, LineupAddPlayerModel, SubmitLineup, LineupCollectionModel, RosterAction } from './models/lineup.model';
import { DraftPickModel } from './models/draft.model';
import { CreateRosterRecordModel, RosterRecordModel } from './models/roster.record.model';


@Injectable()
export class ApiService {

  private base_api= '/api3/'
  private v2_api= '/api2/'
  private data_api = '/data/'

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }



  getGames$(): Observable<MlbGameModel[]> {
    return this.http
      .get<MlbGameModel[]>(`${this.base_api}mlbGames`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getleagueConfig$(): Observable<any> {
    return this.http
      .get<any>(`${this.base_api}league`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getLineupByTeamId$(teamId: string): Observable<LineupModel> {
    return this.http
      .get<LineupModel>(`${this.v2_api}team/${teamId}/lineup`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  getLineupForTeamAndDate$(teamId: string, gmDt: Date): Observable<LineupModel> {
    return this.http
      .get<LineupModel>(`${this.v2_api}lineups/${teamId}/date/${gmDt.toISOString()}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  getMlbPlayers$(): Observable<MlbPlayerModel[]> {
    return this.http
      .get<MlbPlayerModel[]>(`${this.v2_api}players`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

getMlbPlayerStats$(mlbID:string): Observable<any> {
    return this.http
      .get<any>(`https://statsapi.mlb.com/api/v1/people?personIds=${mlbID}&hydrate=stats(group=[hitting,fielding],type=season,season=2025)`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getMlbPlayerNames$():Observable<MlbPlayerModel[]> {
    return this.http
      .get<MlbPlayerModel[]>(`${this.v2_api}playernames`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getAblPlayerPositions$():Observable<MlbPlayerModel[]> {
    return this.http
      .get<MlbPlayerModel[]>(`${this.v2_api}playerpositions`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }


  getMlbRosters$(): Observable<MlbRoster[]> {
    return this.http
      .get<MlbRoster[]>(`${this.v2_api}mlbRosters`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getAblGames$(): Observable<GameClass[]> {
    return this.http
      .get<GameClass[]>(`${this.v2_api}allgames`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error)),
        map((data: GameModel[])=> {
          return data.map((g)=> {
            return new GameClass(g)})
        })
    );
  }


  getAblGamesSummary$(): Observable<GameModel[]> {
    return this.http
      .get<GameModel[]>(`${this.v2_api}allgames?view=summary`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }


  getAblTeams$(): Observable<AblTeamModel[]> {
    return this.http
      .get<AblTeamModel[]>(`${this.base_api}teams`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getOwners$(): Observable<OwnerModel[]> {
    return this.http
      .get<OwnerModel[]>(`${this.base_api}owners`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }



  // GET all admin games - private and public (admin only)
  getAdminGames$(): Observable<MlbGameModel[]> {
    return this.http
      .get<MlbGameModel[]>(`${this.base_api}mlbGames`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }



  // GET an event by ID (login required)
  getPlayerById$(id: string): Observable<MlbPlayerModel> {
    return this.http
      .get<MlbPlayerModel>(`${this.base_api}player/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // GET an event by ID (login required)
  getAblTeamById$(id: string): Observable<AblTeamModel> {
    return this.http
      .get<AblTeamModel>(`${this.base_api}team/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // GET a game by ID (login required)
  getGameById$(id: string): Observable<GameModel> {
    return this.http
      .get<GameModel>(`${this.v2_api}game/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }





     // POST new event (admin only)
  postTeam$(team: AblTeamModel): Observable<AblTeamModel> {
    return this.http
      .post<AblTeamModel>(`${this.base_api}team/new`, team, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // PUT existing event (admin only)
  editTeam$(id: string, team: AblTeamModel): Observable<AblTeamModel> {
    return this.http
      .put<AblTeamModel>(`${this.base_api}team/${id}`, team, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }



  // DELETE existing team (admin only)
  deleteTeam$(id: string): Observable<any> {
    return this.http
      .delete(`${this.base_api}team/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

   // POST new game (admin only)
  postGame$(game: GameModel | GameModel[]): Observable<GameModel> {
    return this.http
      .post<GameModel>(`${this.v2_api}game/new`,game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }



  // PUT existing event (admin only)
  editGame$(id: string,game: GameModel): Observable<GameModel> {
    return this.http
      .put<GameModel>(`${this.v2_api}game/${id}`, game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

    // DELETE existing game (admin only)
  deleteGame$(id: string): Observable<any> {
    return this.http
      .delete(`${this.v2_api}game/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  getData$(flname: string):Observable<any[]> {
    return this.http
      .get<any[]>(`${this.data_api}${flname}`, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))
    )
  }

  getAPIData$(model: string):Observable<any[]> {
    return this.http
      .get<any[]>(`${this.v2_api}${model}`, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))
    )
  }
     // POST new game (admin only)
     postAPIData$(model: string, data: any): Observable<any[]> {
      return this.http
        .post<any>(`${this.v2_api}${model}`,data, {
          headers: new HttpHeaders().set('Authorization', this._authHeader)
        })
        .pipe(
          catchError((error) => this._handleError(error))
        );
    }
    deleteSkip$(data): Observable<any[]> {
      return this.http
      .delete<any>(`${this.v2_api}skips/${data}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
    }

     // POST new game (admin only)
  postData$(model: string, data: any[]): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.data_api}${model}`,data, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  putAPIData$(model: string, id: string, data: any): Observable<any[]> {
    return this.http
      .put<any[]>(`${this.v2_api}${model}/${id}`,data, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }




  oldGames$():Observable<any[]> {
    return this.http
      .get<any[]>(`${this.v2_api}games/oldResults`, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))
    )
  }

   fixoldGame$(gmId):Observable<any[]> {
    return this.http
      .post<any[]>(`${this.v2_api}games/oldResults/${gmId}`,{game: gmId},  {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))
    )
  }

  getMlbGames$(dt: string): Observable<any[]> {

    dt = dt || (new Date()).toLocaleDateString("en-US", {month: '2-digit', day:'2-digit', timeZone: 'America/Chicago', year: 'numeric'})

    // If original string was in MM/dd/YYYY or MM-dd-YYYY format, this converts it to the format expected by the MLB API.
    dt = dt.replaceAll('/', '%2F').replaceAll('-', '%2F')

    return this.http
    .get<any>(`https://statsapi.mlb.com/api/v1/schedule/?sportId=1&date=${dt}`)
    .pipe(
      catchError((error)=> this._handleError(error)),
      map((data)=> {
        let dateObj = data.dates[0]//.find((d)=> d.date == dt.toISOString().substring(0,10))
        return dateObj.games
      })
    )
  }

  getAllLineups$(): Observable<LineupModel[]> {
    return this.http
      .get<LineupModel[]>(`${this.v2_api}lineups`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        tap((data)=> {console.log(data)}),
        catchError((error) => this._handleError(error))
      );
  }

  getSpecificLineup$(tmId: string): Observable<LineupModel> {
    return this.http
      .get<LineupModel[]>(`${this.v2_api}lineups`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        tap((data)=> {
          console.log(data)
        }),
        catchError((error) => this._handleError(error)),
        map((lineups: LineupModel[])=> {return lineups.find((roster)=> roster.ablTeam == tmId)})
      );
  }

  getSkips$(): Observable<LineupModel[]> {
    return this.http
      .get<LineupModel[]>(`${this.v2_api}skips`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      )
  }
  getDraftPicks$(draftType:string= 'draft'): Observable<DraftPickModel[]> {
    return this.http
      .get<DraftPickModel[]>(`${this.v2_api}draftpicks?draftType=${draftType}&season=2025`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      )
  }
  getStandings$(asOfDate:string = (new Date).toISOString().substring(0, 10)): Observable<DraftPickModel[]> {
    return this.http
      .get<any[]>(`${this.v2_api}standings?asOfDate=${asOfDate}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      )
  }


  addPlayertoTeam$(addPlayer: RosterAction ): Observable<LineupModel> {
    return this.http
      .post<LineupModel>(`${this.v2_api}team/${addPlayer.team}/addPlayer`, addPlayer, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  dropPlayerFromTeam$(ablTeamId: string, plyr: string, delayedDrop: boolean = false): Observable<any> {
    if (delayedDrop) {
      return this.postAPIData$('drops', [{ablTeam: ablTeamId, player: plyr}])
    }
    return this.http
        .get<any>(`${this.v2_api}lineups/${ablTeamId}/drop/${plyr}`, {
          headers: new HttpHeaders().set('Authorization', this._authHeader)
        })
        .pipe(
          catchError((error) => this._handleError(error))

        );
  }

  postLineup$(submitLineup): Observable<LineupModel> {
    return this.http
    .post<LineupModel>(`${this.v2_api}lineups`, submitLineup, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))

    );
  }

  postDraftPick$(draftPick): Observable<DraftPickModel> {
    return this.http
    .post<DraftPickModel>(`${this.v2_api}draftpicks`, draftPick, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error))

    );
  }

  putLineup$(ablTeamId: string, lineup: SubmitLineup): Observable<LineupModel> {
    return this.http
    .put<LineupModel>(`${this.v2_api}lineups/${ablTeamId}/date/${lineup.effectiveDate.toISOString()}`, lineup, {
      headers: new HttpHeaders().set('Authorization', this._authHeader)
    })
    .pipe(
      catchError((error) => this._handleError(error)),

    );
  }


  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }





}
