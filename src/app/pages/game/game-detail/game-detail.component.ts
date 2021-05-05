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
  potentialStatlines: object;
  statsSub: Subscription;
  RosterSub: Subscription;
  submitSub: Subscription;
  loading: boolean;
  error: boolean;
  gameResultsObj:GameResultsModel ;
  editable: boolean = false
  score_changed: boolean = false;
  
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
        this.rosters = res;
        this._updateScoreChanged();

      })
    
  }
  
  _saveResult(attest: boolean) {
    
    if (attest) {
      this.submitSub = this.ablGame.attestGame$(this.game._id, 
                                                this._getGameResult(), 
                                                {attester: this.auth.userProfile.sub, attesterType: this.ablGame.gameParticipant(this.game, this.auth.userProfile.sub)}
                                               ).subscribe(res => {
          console.log(`Document updated: ${res}` );
          this.game.results = res.results
        })      
    } else {
      this.submitSub = this.ablGame.saveGameResult$(this.game._id, this._getGameResult())
      .subscribe(res => {
        console.log(`Document updated: ${res}` );
        this.game.results = res.results
      })
    }

  }
  
  
  _getGameResult(): GameResultsModel {
    
    var gameResultsObj: GameResultsModel = {
       status: 'final', 
        scores: [
          {team: this.game.homeTeam._id, location: 'H', regulation: this.rosters.home_score.regulation, final: this.rosters.home_score.final , players: this._getModifiedPlayers(this.rosters.homeTeam) }, 
          {team: this.game.awayTeam._id, location: 'A', regulation: this.rosters.away_score.regulation, final: this.rosters.away_score.final , players: this._getModifiedPlayers(this.rosters.awayTeam) }
        ], 
        winner: this.rosters.result.winner, 
        loser: this.rosters.result.loser, 
        attestations: this.game.results.attestations
      };
    
    
    return gameResultsObj
  }
  
  _getModifiedPlayers(roster) {
    return roster.filter((plyr)=> {return plyr.dailyStats.modified})
  }
  
  
  
  _rawScores(detailScores) {
    return detailScores.map((detailScore)=> {return  {
      location: detailScore.location,
      regulation: detailScore.regulation, 
      final: detailScore.regulation
    }})
  }
  
  _getLiveScoreForTeam(teamloc: string): number {
    return this._getGameResult().scores.find((s)=>{return s.location == teamloc}).final.abl_runs
  }
  
  _updateScoreChanged() {
    this.score_changed = false
    if (this.game.results) {
      this.game.results.scores.forEach((score)=> {
        if (score.final.abl_runs != this._getLiveScoreForTeam(score.location)) {
          this.score_changed = true
        }
      })  
    }
   
  }
  
  
  
  
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
    return this.game.results.attestations.find((a)=> { 
      return this.auth.userProfile.sub == a.attester
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
