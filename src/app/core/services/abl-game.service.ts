import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GameModel , GameResultsModel,  PopulatedGameModel} from './../models/game.model';
import { gameRosters,  rosterScoreRecord, rosterGameScoreRecord } from './../models/roster.record.model';

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
  
  
  saveGameResult$(game: string, gameResult: GameResultsModel): Observable<GameModel> {
    
    return this.editGame$(game,  gameResult)
  }
  
  attestGame$(gmId: string, gameResult: GameResultsModel, attester: any): Observable<GameModel> {
    
    attester.time = new Date();
    gameResult.attestations.push(attester)
    
    return this.editGame$(gmId, gameResult)
  }
  
  removeAttestation$(gmId: string, attestId: string): Observable<GameModel> {
    return this.http
      .put<GameModel>(`${this.base_api}game/${gmId}/attestations`, {attestation_id: attestId}, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  
  gameParticipant(game, user) {
    var home = game.homeTeam.owners.find((o)=> { return user == o.userId})
    var away = game.awayTeam.owners.find((o)=> { return user == o.userId})
    
    if (home) {
      return "home"
    } else if (away) {
      return "away"
    } 
    // return this.game.homeTeam.owners.concat(this.game.awayTeam.owners).find((o)=> { return this.auth.userProfile.sub == o.userId})
  }
  
  
  
//   attestGame$(id: string, game: GameResultsModel): Observable<GameModel> {
    
//   }
  

}
