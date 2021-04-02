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
  
  addAttestation$(game: GameModel, attester: string): Observable<GameModel> {
    
    var gameResultsObj = game.results
    
    var _userInGame = function (gm, user) {
      var home = gm.homeTeam.owners.find((o)=> { return user == o.userId})
      var away = gm.awayTeam.owners.find((o)=> { return user == o.userId})

        if (home) {
          return "home"
        } else if (away) {
          return "away"
        }
        // return this.game.homeTeam.owners.concat(this.game.awayTeam.owners).find((o)=> { return this.auth.userProfile.sub == o.userId})
      }
    
    gameResultsObj.attestations.push({attester:attester, attesterType: _userInGame(game, attester), time: new Date()})
    
    return this.editGame$(game._id, gameResultsObj)
  }
  
  
  
  attestGame$(game: GameModel, rosters: gameRosters, attester: string): Observable<GameModel> {
    
    var gameResultsObj = game.results
    if (gameResultsObj) {
      gameResultsObj = {
       status: 'final', 
        scores: [
          {team: game.homeTeam._id, location: 'H', regulation: rosters.home_score.regulation, final: rosters.home_score.final  }, 
          {team: game.awayTeam._id, location: 'A', regulation: rosters.away_score.regulation, final: rosters.away_score.final  }
        ], 
        winner: rosters.result.winner, 
        loser: rosters.result.loser, 
        attestations: []
      };
    } 
    
    var _userInGame = function (gm, user) {
      var home = gm.homeTeam.owners.find((o)=> { return user == o.userId})
      var away = gm.awayTeam.owners.find((o)=> { return user == o.userId})

        if (home) {
          return "home"
        } else if (away) {
          return "away"
        }
        // return this.game.homeTeam.owners.concat(this.game.awayTeam.owners).find((o)=> { return this.auth.userProfile.sub == o.userId})
      }
    
    gameResultsObj.attestations.push({attester:attester, attesterType: _userInGame(game, attester), time: new Date()})
    
    return this.editGame$(game._id, gameResultsObj)
  }
  
//   attestGame$(id: string, game: GameResultsModel): Observable<GameModel> {
    
//   }
  

}
