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

  // GET list of public, future events
  getEvents$(): Observable<EventModel[]> {
    return this.http
      .get<EventModel[]>(`${this.base_api}events`)
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  getGames$(): Observable<MlbGameModel[]> {
    return this.http
      .get<MlbGameModel[]>(`${this.base_api}mlbGames`)
      .pipe(
        catchError((error) => this._handleError(error))  
    );
  }
  
  getMlbPlayers$(): Observable<MlbPlayerModel[]> {
    return this.http
      .get<MlbPlayerModel[]>(`${this.base_api}mlbplayers`)
      .pipe(
        catchError((error) => this._handleError(error))  
    );
  }
  
  getAblGames$(): Observable<GameModel[]> {
    return this.http
      .get<GameModel[]>(`${this.base_api}games`, {
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

  // GET all events - private and public (admin only)
  getAdminEvents$(): Observable<EventModel[]> {
    return this.http
      .get<EventModel[]>(`${this.base_api}events/admin`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
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
  getEventById$(id: string): Observable<EventModel> {
    return this.http
      .get<EventModel>(`${this.base_api}event/${id}`, {
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
      .get<GameModel>(`${this.base_api}game/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  // GET a roster by ID (login required)
//   getRosterById$(id: string): Observable<RosterModel> {
//     return this.http
//       .get<RosterModel>(`${this.base_api}roster/${id}`, {
//         headers: new HttpHeaders().set('Authorization', this._authHeader)
//       })
//       .pipe(
//         catchError((error) => this._handleError(error))
//       );
//   }
  
  // GET RSVPs by event ID (login required)
  getRsvpsByEventId$(eventId: string): Observable<RsvpModel[]> {
    return this.http
      .get<RsvpModel[]>(`${this.base_api}event/${eventId}/rsvps`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  // POST new RSVP (login required)
  postRsvp$(rsvp: RsvpModel): Observable<RsvpModel> {
    return this.http
      .post<RsvpModel>(`${this.base_api}rsvp/new`, rsvp, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // PUT existing RSVP (login required)
  editRsvp$(id: string, rsvp: RsvpModel): Observable<RsvpModel> {
    return this.http
      .put(`${this.base_api}rsvp/${id}`, rsvp, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
   // POST new event (admin only)
  postEvent$(event: EventModel): Observable<EventModel> {
    return this.http
      .post<EventModel>(`${this.base_api}event/new`, event, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // PUT existing event (admin only)
  editEvent$(id: string, event: EventModel): Observable<EventModel> {
    return this.http
      .put<EventModel>(`${this.base_api}event/${id}`, event, {
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
  
  

  // DELETE existing event and all associated RSVPs (admin only)
  deleteEvent$(id: string): Observable<any> {
    return this.http
      .delete(`${this.base_api}event/${id}`, {
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
      .post<GameModel>(`${this.base_api}game/new`,game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // PUT existing event (admin only)
  editGame$(id: string,game: GameModel): Observable<GameModel> {
    return this.http
      .put<GameModel>(`${this.base_api}game/${id}`, game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
    // DELETE existing game (admin only)
  deleteGame$(id: string): Observable<any> {
    return this.http
      .delete(`${this.base_api}game/${id}`, {
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
  


  
  

  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }
  


  

}
