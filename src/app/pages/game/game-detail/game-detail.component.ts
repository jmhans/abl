// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input ,ViewChild} from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { GameModel, PopulatedGameModel , GameResultsModel} from './../../../core/models/game.model';
import { StatlineModel } from './../../../core/models/statline.model';
import { LineupModel } from './../../../core/models/lineup.model';
import { gameRosters,  rosterScoreRecord, rosterGameScoreRecord } from './../../../core/models/roster.record.model';
import { AblGameService } from './../../../core/services/abl-game.service';
import { RosterService } from './../../../core/services/roster.service';
import { Subscription, interval, Observable, from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import {GameTeamDetailComponent} from './game-team-detail/game-team-detail.component';
  interface potentialSL {
    tm: string
    plyrs: StatlineModel[]
  }


@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})


export class GameDetailComponent {
  @ViewChild('awayChild') awayChild: GameTeamDetailComponent;
  @ViewChild('homeChild') homeChild: GameTeamDetailComponent;

  @Input() game: GameModel;
  rosters: gameRosters;
  calc_rosters: gameRosters;
  potentialStatlines: object;
  statsSub: Subscription;
  RosterSub: Subscription;
  submitSub: Subscription;
  loading: boolean;
  error: boolean;
  gameResultsObj:GameResultsModel ;
  editable: boolean = false
  score_changed: boolean = false;
  
  active_result: GameResultsModel;
  score_exists = () => {
    var res = this.game.results.find((result)=> {return result.status == 'final'}) 
    if (res) {
      return true
    } else {
      return false
    }                  
                        
  }
  
  attestation_count = () => {return this.active_result.attestations.length }
  
  
  
  constructor(
    public utils: UtilsService,
    public auth: AuthService, 
    public ablGame: AblGameService, 
    public rosterService: RosterService
  ) { }
  
  ngOnInit() {
    this._getRosters();
    //this.getStats();
  }

  _getRosters() {
    
    this.potentialStatlines = {};
    
    console.log(this.auth.userProfile)
    


    this.statsSub = this.ablGame.getGameRosters$(this.game._id)
      .subscribe(res => {

        this._setActiveResult();
      
          if ( this.active_result) {
            this.rosters = {
              away_score: this.active_result.scores.find((sc)=> {return sc.location == 'A'}), 
              home_score: this.active_result.scores.find((sc)=> {return sc.location == 'H'}), 
              awayTeam: this.active_result.scores.find((sc)=> {return sc.location == 'A'}).players, 
              homeTeam:this.active_result.scores.find((sc)=> {return sc.location == 'H'}).players , 
              status: this.active_result.status,
              result: {winner: this.active_result.winner, loser: this.active_result.loser}
            }
          } else {
            this.rosters = res
          }
 //       this.calc_rosters = res;
        this._updateScoreChanged();

      })
    
  }
  
  

  
  _setActiveResult(idx = null ) {
    
    if (idx) {
      this.active_result = this.game.results[idx]  
    } else {
      this.active_result = this.game.results.find((result)=> {
        if (result) {
        return result.status == 'final'
        }
      })
    }
    
  }
  
  
  _saveResult(attest: boolean) {
    
    if (false) { //dispute!
      this.submitSub = this.ablGame.attestGame$(this.game._id, 
                                                this._getGameResult(), 
                                                {attester: this.auth.userProfile.sub, attesterType: this.ablGame.gameParticipant(this.game, this.auth.userProfile.sub)}
                                               ).subscribe(res => {
          console.log(`Document updated: ${res}` );
          this.game.results = res.results
          
          this._setActiveResult();
        })
    }
    
    
    if (attest) {
      this.submitSub = this.ablGame.attestGame$(this.game._id, 
                                                this._getGameResult(), 
                                                {attester: this.auth.userProfile.sub, attesterType: this.ablGame.gameParticipant(this.game, this.auth.userProfile.sub)}
                                               ).subscribe(res => {
          console.log(`Document updated: ${res}` );
          this.game.results = res.results
          this._setActiveResult();
          this._updateScoreChanged();
        })      
    } else {
      this.submitSub = this.ablGame.saveGameResult$(this.game._id, this._getGameResult())
      .subscribe(res => {
        console.log(`Document updated: ${res}` );
        this.game.results = res.results
        this._setActiveResult();
        this._updateScoreChanged();
      })
    }
    
    

  }
  
  _disputeScore() {
    // Update saved score record to have status "disputed"
    // Create new results record with alternate scoring.  
    
    var newScore: GameResultsModel  =  {
       status: 'disputed',
        scores: [
          {team: this.game.homeTeam._id, location: 'H', regulation: this.rosters.home_score.regulation, final: this.rosters.home_score.final , players: this._getActivePlayers(this.rosters.homeTeam) }, 
          {team: this.game.awayTeam._id, location: 'A', regulation: this.rosters.away_score.regulation, final: this.rosters.away_score.final , players: this._getActivePlayers(this.rosters.awayTeam) }
        ], 
        winner: this.rosters.result.winner, 
        loser: this.rosters.result.loser, 
        attestations: [], 
        created_by: this.auth.userProfile.sub
      };
   
    this.game.results.push( newScore)
    this._setActiveResult(this.game.results.length-1)
  }
  
  
  
  _removeAttestation(attId: string) {
    
    var result_index = this.game.results.indexOf(this.active_result)
    
    this.submitSub = this.ablGame.removeAttestation$(this.game._id, result_index, attId).subscribe(res => {

      this.game.results = res.results
      this._setActiveResult()
      
      this._updateScoreChanged();
    })
  }
  
  
  
  _getGameResult(): GameResultsModel {
    
    var gameResultsObj: GameResultsModel
      
    if (this.game.results.length > 1) {
        var status = 'disputed'
      }
    
      gameResultsObj = {
       status: status || 'saved', 
        scores: [
          {team: this.game.homeTeam._id, location: 'H', regulation: this.rosters.home_score.regulation, final: this.rosters.home_score.final , players: this._getActivePlayers(this.rosters.homeTeam) }, 
          {team: this.game.awayTeam._id, location: 'A', regulation: this.rosters.away_score.regulation, final: this.rosters.away_score.final , players: this._getActivePlayers(this.rosters.awayTeam) }
        ], 
        winner: this.rosters.result.winner, 
        loser: this.rosters.result.loser, 
        attestations: this.active_result.attestations
      };
    
    return gameResultsObj
  }
  
  _getActivePlayers(roster) {
    return roster 
    // return roster.filter((plyr)=> {return plyr.ablstatus == "active"})
  }
  
  
  
  _rawScores(detailScores) {
    
    if (detailScores) {
      return {
        h: detailScores.find((sc)=>{ return sc.location == 'H'}).final.abl_runs, 
        a: detailScores.find((sc)=>{ return sc.location == 'A'}).final.abl_runs, 
      }      
    } else {
      return {}
    }

    
    
    return detailScores.map((detailScore)=> {return  {
      location: detailScore.location,
      regulation: detailScore.regulation, 
      final: detailScore.final
    }})
  }
  
  _getLiveScoreForTeam(teamloc: string): number {
    return this._getGameResult().scores.find((s)=>{return s.location == teamloc}).final.abl_runs
  }
  
  _updateScoreChanged() {
    this.score_changed = false
    if (this.active_result  && this.active_result.scores.length > 0) {
      this.active_result.scores.forEach((score)=> {
        if (score.final.abl_runs != this._getLiveScoreForTeam(score.location)) {
          this.score_changed = true
        }
      })  
    }
   
  }
  
  
  // Scenarios: 
  // 1: Score is not saved. Anyone can save score. (if owner, will also add attestation) - DONE
  // 2: Score is saved.    
  //    2.1: Calc score is Same 
  //      2.1.1: Owner has attested: Owner can't remove attestation - DONE
  //      2.1.2: Owner has not attested: Owner can attest  - DONE
  //    2.2: Calc score is different: 
  //      2.2.1: Owner has attested: Owner can remove attestation. (once done, that will put into 2.2.2) - DONE
  //      2.2.2: Owner has not attested:
  //        2.2.2.1: Opponent has attested: Owner can dispute score.  
  //        2.2.2.2: Opponent has not attested (So, nobody has attested): Anyone can overwrite score  (if owner, could also add attestation) - DONE
  //    
  
  
  
  _userInGame() {
    var home = this.game.homeTeam.owners.find((o)=> { return this.auth.userProfile.sub == o.userId})
    var away = this.game.awayTeam.owners.find((o)=> { return this.auth.userProfile.sub == o.userId})
    
    if (home) {
      return "home"
    } else if (away) {
      return "away"
    }
    // return this.game.homeTeam.owners.concat(this.game.awayTeam.owners).find((o)=> { return this.auth.userProfile.sub == o.userId})
  }
  
  _userHasAttested() {
    return this.active_result.attestations.find((a)=> { 
      return this.auth.userProfile.sub == a.attester
    })
  }
  
  _opponentHasAttested() {
    return this.active_result.attestations.find((a)=> { 
      return this.auth.userProfile.sub != a.attester
    })
  }
  
  
  _updateScore($evt, team) {
    if (team == "home") {
      this.rosters.home_score = $evt
    //  this.awayChild.updateTeamScore(true)
    } else {
      this.rosters.away_score = $evt
     // this.homeChild.updateTeamScore(true)
    }
    this._updateScoreChanged()
  }
  
  ngOnDestroy() {
   // this.RosterSub.unsubscribe();
    this.statsSub.unsubscribe();
    if (this.submitSub) { this.submitSub.unsubscribe()}
    
  }


}
