// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { GameModel, PopulatedGameModel } from './../../../core/models/game.model';
import { StatlineModel } from './../../../core/models/statline.model';
import { LineupModel } from './../../../core/models/lineup.model';
import { AblGameService } from './../../../core/services/abl-game.service';
import { RosterService } from './../../../core/services/roster.service';
import { Subscription, interval, Observable, from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

  interface potentialSL {
    tm: string
    plyrs: StatlineModel[]
  }


interface rosterScoreRecord {
  abl_runs : Number
  abl_points : Number
  e : Number
  ab : Number
  g : Number
  h : Number
  hr : Number
  bb : Number
  hbp : Number
  sac : Number
  sf : Number
  sb : Number
  cs : Number
}

interface rosterGameScoreRecord {
  regulation: rosterScoreRecord
  final: rosterScoreRecord
}

interface gameRosters {
  away_score: rosterGameScoreRecord
  home_score: rosterGameScoreRecord
  awayTeam: {}
  homeTeam: {}
  result: {winner: {}, loser: {}}
}

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})


export class GameDetailComponent {
  
  @Input() game: PopulatedGameModel;
  rosters: gameRosters;
  potentialStatlines: object;
  statsSub: Subscription;
  RosterSub: Subscription;
  submitSub: Subscription;
  loading: boolean;
  error: boolean;
  
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
      })
    
  }
  
  _saveResult() {
    var gameResultsObj = {
       status: 'final', 
        scores: [
          {team: this.game.homeTeam._id, location: 'H', regulation: this.rosters.home_score.regulation, final: this.rosters.home_score.final  }, 
          {team: this.game.awayTeam._id, location: 'A', regulation: this.rosters.away_score.regulation, final: this.rosters.away_score.final  }
        ], 
        winner: this.rosters.result.winner, 
        loser: this.rosters.result.loser, 
        attestations: [{attester: this.auth.userProfile.sub, time: new Date()}]
      };
    
    this.submitSub = this.ablGame.editGame$(this.game._id, gameResultsObj)
      .subscribe(res => {
        console.log(`Document updated: ${res}` );
      })
  }
  
  
  
  ngOnDestroy() {
   // this.RosterSub.unsubscribe();
    this.statsSub.unsubscribe();
    if (this.submitSub) { this.submitSub.unsubscribe()}
    
  }


}
