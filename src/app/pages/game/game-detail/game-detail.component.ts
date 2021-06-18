// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input ,ViewChild} from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { CloneService } from './../../../core/services/clone.service';
import { GameModel, PopulatedGameModel , GameResultsModel, GameResultForm} from './../../../core/models/game.model';
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
  templateUrl: './game-detail2.component.html',
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
  gameResult: GameResultForm
  liveRosters: gameRosters;
  editable: boolean = false
  score_changed: boolean = false;
  live_result: GameResultsModel;
  active_result_index: number;
  active_result: GameResultsModel;
  originalresults: GameResultsModel[];
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
    public rosterService: RosterService,
     private clonerService: CloneService
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
         // Add live score to results array. 
          
       this._setResults(res)
        this._setActiveResult();
        this.liveRosters = res;
 //       this.calc_rosters = res;
        this._updateScoreChanged();

      })
    
  }
  
  convertRosterScores(players, team,  location, score) {
    return {
      players: players, 
      team: team, 
      location: location, 
      regulation: score.regulation, 
      final: score.final
    }
  }
  
  _setResults(gameContent) {
     this.live_result = {
          status: gameContent.status, 
          scores: [this.convertRosterScores(gameContent.homeTeam, this.game.homeTeam._id, 'H', gameContent.home_score), this.convertRosterScores(gameContent.awayTeam, this.game.awayTeam._id, 'A', gameContent.away_score)], 
          winner: gameContent.result.winner, 
          loser: gameContent.result.loser, 
          attestations: []
        } 
    
    this.originalresults =  this.clonerService.deepClone(this.game.results);
    
  }
  
 

  
  _teamAttested(team) {
    var att = this.active_result.attestations.find((att)=> {return att.attesterType == team});
    if (att) return true;
  }
  
  
  
  _setActiveResult(idx = null, ignoreUpdate = false ) {
    if (idx != this.active_result_index && !ignoreUpdate) {
      this.editable = false
    }
    this.active_result_index = idx || 0
    if (idx) {

      if (idx == -1) {
        this.active_result = this.live_result
      } else {
          this.active_result = this.game.results[idx]
      }
      
    } else {
      this.active_result = this.game.results[0]
    }
    
    this.rosters = {
          away_score: this.active_result.scores.find((sc)=> {return sc.location == 'A'}), 
          home_score: this.active_result.scores.find((sc)=> {return sc.location == 'H'}), 
          awayTeam: this.active_result.scores.find((sc)=> {return sc.location == 'A'}).players, 
          homeTeam:this.active_result.scores.find((sc)=> {return sc.location == 'H'}).players , 
          status: this.active_result.status,
          result: {winner: this.active_result.winner, loser: this.active_result.loser}
        }
    
  }
  
  
  _saveResult(attestType: string) {
    var attestObj = {}
    var existingAtt = this._teamAttestationsActiveResult(attestType);
    if (existingAtt) {
      attestObj = {_id: existingAtt[0]._id, attester: this.auth.userProfile.sub, attesterType: attestType}
    } else {
      attestObj = { attester: this.auth.userProfile.sub, attesterType: attestType}
    }
        
    if (attestType) {
      if (this.active_result._id) {
            // Add attestation to existing score. 
            this.submitSub = this.ablGame.addAttestation$(this.game._id, this.active_result._id, attestObj).subscribe(res => {
            console.log(`Document updated: ${res}` );
            //this.game.results = res.results
            this.active_result = res
    //        this._setActiveResult();
    //        this._updateScoreChanged();

           })        
        } else {
          // Score doesn't exist yet. Save the score with attestation.
          this.submitSub = this.ablGame.saveGameResult$(this.game._id, this.active_result)
            .subscribe(res => {
              console.log(`Document updated: ${res}` );
              
              return this.ablGame.addAttestation$(this.game._id, res._id, attestObj).subscribe( attRes => {
//                this.game.results = attRes.results
                this.game.results.push(attRes);
                this.active_result = attRes
                this.active_result_index = this.game.results.length - 1 
  //              this._setActiveResult();
  //              this._updateScoreChanged()
              })


  //            this.game.results = res.results
  //            this._setActiveResult();
  //            this._updateScoreChanged();
            })
        }
      } else {
        
      // No attestation - just saving the score.  
        
      this.submitSub = this.ablGame.saveGameResult$(this.game._id, this.active_result)
      .subscribe(res => {
        console.log(`Document updated: ${res}` );
        this.active_result = res
//        this._setActiveResult();
//        this._updateScoreChanged();
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
    
    this.submitSub = this.ablGame.removeAttestation$(this.game._id, this.active_result._id, attId).subscribe(res => {

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
  
  
  _changeEdit(evt) {
    
    if (evt.checked == true) {
      if (this.active_result_index == -1) {
        this.game.results.push(JSON.parse(JSON.stringify(this.active_result)))
        this.game.results[this.game.results.length - 1].status = 'draft'
        this._setActiveResult(this.game.results.length -1, true)
      }
        
        
    }
    
    
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
    if (teamloc == 'H') { 
      return this.rosters.home_score.final.abl_runs
    } else {
      return this.rosters.away_score.final.abl_runs
    }
    
  }
  
  _updateScoreChanged() {

    
     var hasChanges = false;
      for (let prop in this.game.results[this.active_result_index]) {
        if (this.originalresults[this.active_result_index][prop] !== this.game.results[this.active_result_index][prop]) {hasChanges = true;}
        
      }
      this.score_changed = hasChanges
      return hasChanges;
    
    
    
    
   
  }
  

    _scoreDiff(scoreIdx) {
      var hasChanges = false;
      for (let prop in this.game.results[scoreIdx]) {
        if (this.originalresults[scoreIdx][prop] !== this.game.results[scoreIdx][prop]) {hasChanges = true;}
        
      }
      return hasChanges;
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
  
  _teamOwner(loc: string) {
    if (loc == 'home') {
      return this.game.homeTeam.owners.find((o)=> {return this.auth.userProfile.sub == o.userId})
    } else if (loc == 'away') {
      return this.game.awayTeam.owners.find((o)=> {return this.auth.userProfile.sub == o.userId})
    }
    return this.game.homeTeam.owners.find((o)=> {return this.auth.userProfile.sub == o.userId}) || this.game.awayTeam.owners.find((o)=> {return this.auth.userProfile.sub == o.userId})
  }
  
  
  _userHasAttested() {
    return this.active_result.attestations.find((a)=> { 
      return this.auth.userProfile.sub == a.attester
    })
  }
  
  _opponentHasAttested() {
    if (this.active_result) {
      return this.active_result.attestations.find((a)=> { 
        return this.auth.userProfile.sub != a.attester
      })
    }
  }
  
  
  _resultsWithTeamAttestations(location) {
    // A score can be saved as long as nobody else besides the current user has attested to it. 
    // And, it's actually different than the initial version.  
    
    
    return this.game.results.filter((res) => {
      var userAtt = res.attestations.find((a) => {
        return this.auth.userProfile.sub == a.attester && (location ? a.attesterType == location : true)
      })
      if (userAtt) {
        return true
      } else return false;
    })
    
  }
  
  _teamAttestationsActiveResult(location) {
        
    return this.active_result.attestations.filter((att)=> {return this.auth.userProfile.sub == att.attester && (location ? att.attesterType == location : true)})

  }
  
  
  _canAttest(location) {
    // Has not attested to any other score record. 
    // Has attested to this record, but score has changed, and nobody else has attested to this record. 
    // Is a team owner for this location
    var atts = this._resultsWithTeamAttestations(location)
    
    if (!this._teamOwner(location)) return false
    
    if (atts.length == 0) {
      return true
    } else {
      return this.active_result == atts[0] && !this._opponentHasAttested() // && add condition for score has changed. 
    }
    
  }
  
  _canSave() {
    // Can not attest. (If they can attest, they should just attest)
    // Score has changed (optional)
    // Opponent has not attested (though, they shouldn't even be able to edit in that case...)
    return !this._canAttest('home') && !this._canAttest('away') && !this._opponentHasAttested()
    
    
  }
  
//   _canEdit() {
//     // Score record has not been attested by another person. 
//     return !this._opponentHasAttested()
//   }
  
  
  
  _updateScore($evt, scoreRec) {
    
    scoreRec.regulation = $evt.regulation
    scoreRec.final = $evt.final
    
//     if (team == "home") {
//       this.rosters.home_score = $evt
//     //  this.awayChild.updateTeamScore(true)
//     } else {
//       this.rosters.away_score = $evt
//      // this.homeChild.updateTeamScore(true)
//     }
    this._updateScoreChanged()
  }
  
  ngOnDestroy() {
   // this.RosterSub.unsubscribe();
    this.statsSub.unsubscribe();
    if (this.submitSub) { this.submitSub.unsubscribe()}
    
  }


}
