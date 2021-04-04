import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { RosterRecordModel, CreateRosterRecordModel } from './../models/roster.record.model';
import { LineupModel, LineupAddPlayerModel, SubmitLineup, LineupCollectionModel } from './../models/lineup.model';
import { MlbPlayerModel } from './../models/mlb.player.model';
import { AuthService } from './../../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RosterService {
  private base_api= '/api2/'
  
  
  constructor(    
    private http: HttpClient,
    private auth: AuthService) { }
  
  
  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }
  
  
  // POST new roster record (authorized only)
  
  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }
  
   
  getLineupByTeamId$(teamId: string): Observable<LineupModel> {
    return this.http
      .get<LineupModel>(`${this.base_api}team/${teamId}/lineup`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  addPlayertoTeam$(addPlayer: Object, ablTeamId: string ): Observable<LineupModel> {
    return this.http
      .post<LineupModel>(`${this.base_api}team/${ablTeamId}/addPlayer`, addPlayer, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  draftPlayersToTeam$(addPlayers: Object[], ablTeamId: string ): Observable<LineupModel> {
    return this.http
      .post<LineupModel>(`${this.base_api}team/${ablTeamId}/draftPlayers`, addPlayers, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  updateRosterRecord$(lineupId: string, lineup: SubmitLineup ): Observable<LineupCollectionModel> {
    return this.http
      .put<LineupCollectionModel>(`${this.base_api}lineup_roster/${lineupId}`, lineup, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

}
