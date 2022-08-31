// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { ENV } from './env.config';
import { EventModel } from './models/event.model';
import { RsvpModel } from './models/rsvp.model';
import { MlbGameModel } from './models/mlbgame.model';
import { GameModel } from './models/game.model';
import { AblTeamModel } from './models/abl.team.model';
import { OwnerModel } from './models/owner.model';
import { MlbPlayerModel } from './models/mlb.player.model';
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

  getMlbPlayers$(): Observable<MlbPlayerModel[]> {
    return this.http
      .get<MlbPlayerModel[]>(`${this.v2_api}players`)
      .pipe(
        catchError((error) => this._handleError(error))
    );
  }

  getAblGames$(): Observable<GameModel[]> {
    return this.http
      .get<GameModel[]>(`${this.v2_api}allgames`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
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
  postGame$(game: GameModel): Observable<GameModel> {
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
  postData$(model: string, data: any[]): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.data_api}${model}`,data, {
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




  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }





}
