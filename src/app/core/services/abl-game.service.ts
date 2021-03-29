import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GameModel , GameResultsModel} from './../models/game.model';


import { StatlineModel } from './../models/statline.model';

@Injectable({
  providedIn: 'root'
})
export class AblGameService {
  private base_api= '/api3/'
  
  
  constructor(    
    private http: HttpClient,
    private auth: AuthService
    ) { }
  
  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }
  
  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }
  
  
  getStatsForPlayer$(mlbId: string): Observable<StatlineModel[]> {
    return this.http
      .get<StatlineModel[]>(`${this.base_api}statlines/${mlbId}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  getGameStatsForPlayer$(mlbId: string, gameDate: string): Observable<StatlineModel[]> {
    return this.http
      .get<StatlineModel[]>(`${this.base_api}statlines/${mlbId}?gameDate=${gameDate}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  getGameRosters$(gameId: string): Observable<any> {
    
    return this.http
      .get<[]>(`${this.base_api}game/${gameId}/rosters`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
    // PUT existing event (admin only)
  editGame$(id: string,game: GameResultsModel): Observable<GameModel> {
    return this.http
      .put<GameModel>(`${this.base_api}game/${id}/results`, game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  

}
