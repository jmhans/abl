import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

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
  editGame$(id: string,game: GameResultsModel): Observable<GameResultsModel> {
    // This will edit saved results only. It will not have an impact on the individual player stats DB, etc.  
    
    
    return this.http
      .put<GameResultsModel>(`${this.base_api}game/${id}/results`, game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  
  saveGameResult$(game: string, gameResult: GameResultsModel): Observable<GameResultsModel> {
    
    return this.editGame$(game,  gameResult)
  }
  
  attestGame$(gmId: string, gameResult: GameResultsModel, attester: any): Observable<GameResultsModel> {
    
    attester.time = new Date();
    if (attester._id) {
      var priorAtt = gameResult.attestations.find((att)=> {return att._id == attester._id})

    }      
    if (priorAtt) {
        priorAtt = attester
      } else {
      gameResult.attestations.push(attester)  
    } 
    
    if      (gameResult.attestations.length >= 2) {gameResult.status = 'final';} 
    else if (gameResult.attestations.length == 1) {gameResult.status = 'awaiting validation';}
    else                                          {gameResult.status = 'awaiting attestation';}    

    return this.editGame$(gmId, gameResult)
  }
  
  addAttestation$(gmId: string, resultId: string, attest: {}): Observable<GameResultsModel> {
  
    
      return this.http
      .post<GameModel>(`${this.base_api}game/${gmId}/score/${resultId}/attestations`, attest, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
    }
  
    addAttestationOptions$(gmId: string, resultId: string, attest: {}, options: {}): Observable<GameResultsModel> {
  
    
      return this.http
      .post<GameModel>(`${this.base_api}game/${gmId}/score/${resultId}/attestations`, attest, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
    }
  
  
  saveGameAndAttest$(gmId: string, result: GameResultsModel, attest: {}): Observable<GameResultsModel> {
    if (result._id) {
      // Result exists. Overwrite it. Then add attestation to it. 
      return this.editGame$(gmId, result).pipe(
        mergeMap(()=> this.addAttestation$(gmId, result._id, attest))
      )
    } else {
      // Result doesn't exist yet. Need to create one. Then, add the attestation to it. 
      return this.postResult$(gmId, result).pipe(
        mergeMap((updatedResult)=> this.addAttestation$(gmId, updatedResult._id, attest))
      )
    }

  }
  
  postResult$(id: string,game: GameResultsModel): Observable<GameResultsModel> {
        
    return this.http
      .post<GameResultsModel>(`${this.base_api}game/${id}/results`, game, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  deleteResult$(id: string,resultId: string): Observable<GameResultsModel> {
        
    return this.http
      .delete<GameResultsModel>(`${this.base_api}game/${id}/results/${resultId}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }
  
  
  removeAttestation$(gmId: string, resultId: string, attestId: string): Observable<GameModel> {
    return this.http
      .delete<GameModel>(`${this.base_api}game/${gmId}/score/${resultId}/attestations/${attestId}`, {
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
