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
  activeChanged: boolean = false; // Bool to identify whether the current active score differs from the DB version of itself.
  activeDifference: boolean = false; // Bool to identify whether the current active score differs from the live calculated result (which came from the backend API)
  homeAttestations: object[];
  awayAttestations: object[];
  ownerLocs: string[] = [];


  canAttest: string[];

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


  _getOwnerLocs() {
    if (this._teamOwner('away')) this.ownerLocs.push('away')
    if (this._teamOwner('home')) this.ownerLocs.push('home')
  }


  _getRosters() {

    this.potentialStatlines = {};


    this.statsSub = this.ablGame.getGameRosters$(this.game._id)
      .subscribe(res => {
         // Add live score to results array.
        this._getOwnerLocs();
        this._setResults(res)
        this._setActiveResult();
        this.liveRosters = res;
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

    idx = idx || (this.game.results.length > 0 ? 0 : -1)

    this.active_result_index = idx

    if (idx) {

      if (idx == -1) {
        this.active_result = this.live_result
      } else {
          this.active_result = this.game.results[idx]
      }

    } else {
        this.active_result = this.game.results[0]  ? this.game.results[0] : this.live_result
    }

    this._updateScoreChanged()
  }


  _saveResult(attestType: string) {
    var attestObj = {}
    var existingAtt = this._teamAttestationsActiveResult(attestType);
    if (existingAtt.length > 0) {
      attestObj = {_id: existingAtt[0]._id, attester: this.auth.userProfile.sub, attesterType: attestType}
    } else {
      attestObj = { attester: this.auth.userProfile.sub, attesterType: attestType}
    }

    if (attestType) {
        // Add attestation to existing score.
            this.submitSub = this.ablGame.saveGameAndAttest$(this.game._id, this.active_result, attestObj).subscribe(res => {
            this._handleGameResultUpdate(res)

           })
      } else {

      // No attestation - just saving the score.

      this.submitSub = this.ablGame.saveGameResult$(this.game._id, this.active_result)
      .subscribe(res => {
        console.log(`Document updated: ${res}` );

          this._handleGameResultUpdate(res)

      })
    }

  }


  _handleGameResultUpdate(response) {
      if (!this.active_result._id) {
        if (this.active_result.status == 'draft') {
          this.game.results.splice(this.active_result_index, 1)
        }
          this.game.results.push(response)
          this.active_result_index = this.game.results.length -1
        } else {
          var findObj = this.game.results.find((res)=> {return res._id == response._id})

          if (findObj) {
            this.active_result_index = this.game.results.indexOf(findObj)
            this.game.results[this.active_result_index] = response

          } else {
            console.log("That's weird. The active result had an id, but the response that came back from the DB did not.")
          }
        }
        this._setActiveResult(this.active_result_index);
        this.originalresults =  this.clonerService.deepClone(this.game.results);
        this._updateScoreChanged();


  }

  _handleGameResultDelete(response) {
      var delRes = this.game.results.find((result)=> {return result._id == response})

      if (delRes) {
        var idx = this.game.results.indexOf(delRes)
        this.game.results.splice(idx, 1)
      }

      if (this.active_result_index == idx) {
        this._setActiveResult();
      }

        this.originalresults =  this.clonerService.deepClone(this.game.results);
        this._updateScoreChanged();


  }



  _removeAttestation(attId: string) {

    var result_index = this.game.results.indexOf(this.active_result)

    this.submitSub = this.ablGame.removeAttestation$(this.game._id, this.active_result._id, attId).subscribe(res => {

      this.game.results = res.results
      this._setActiveResult()

      this._updateScoreChanged();
    })
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


  _updateScoreChanged() {
    this.activeChanged = this.active_result_index > -1 ? !this._scoreCompare(this.active_result, this.originalresults[this.active_result_index]) : false
    this.activeDifference = !this._scoreCompare(this.active_result, this.live_result)
    this.homeAttestations = this._attestationsActiveResult('home', false)
    this.awayAttestations = this._attestationsActiveResult('away', false)

  }


    _scoreDiff(scoreIdx) {

      if (this.originalresults && this.game.results && this.originalresults.length > scoreIdx && this.game.results.length > scoreIdx) {
        return !this._scoreCompare(this.originalresults[scoreIdx], this.game.results[scoreIdx])

       // return JSON.stringify(this.originalresults[scoreIdx].scores) !== JSON.stringify(this.game.results[scoreIdx].scores)
      }
        return false
    }

    _scoreCompare(s1, s2) {

      var matches = true
      if (s1 && s2) {

        const keys =  [ 'team', 'location']
        const matchFields = ['regulation', 'final']

        s1.scores.forEach((sc) => {
          const matchingScore = s2.scores.find((sc2)=> {
            var keyMatch = true
            keys.forEach((k)=> {
              if (sc[k] != sc2[k]) {
                keyMatch = false
              }
            })
            return keyMatch
          })
          if (!matchingScore) {
            matches = false
          } else {
            matchFields.forEach((mf) => {
              if (JSON.stringify(sc[mf]) != JSON.stringify(matchingScore[mf])) {
                matches = false
              }
            })

          }
        })

        return matches




        // return JSON.stringify(s1.scores) == JSON.stringify(s2.scores)
      }
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


  _oppAttested(resIdx = null) {

    if (resIdx) {
      return this.game.results[resIdx].attestations.find((a)=> {
        return this.ownerLocs.find((loc)=> {return loc != a.attesterType})
      })
    } else {
      return this.game.results.find((result)=>{
        return result.attestations.find((a)=> {
          return this.ownerLocs.find((loc)=> {return loc != a.attesterType})
        })
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

  _attestationsActiveResult(location, activeTeam = true) {
    return this.active_result.attestations.filter((att)=> {return (activeTeam? this.auth.userProfile.sub == att.attester : true) && (location ? att.attesterType == location : true)})
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
      return this.activeChanged && !this._opponentHasAttested() // && add condition for score has changed.
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

    this._updateScoreChanged()
  }

  _deleteResult(resId) {
     this.submitSub = this.ablGame.deleteResult$(this.game._id, resId)
      .subscribe(res => {
        console.log(`Document updated: ${res}` );

          this._handleGameResultDelete(resId)

      })
  }

  ngOnDestroy() {
   // this.RosterSub.unsubscribe();
    this.statsSub.unsubscribe();
    if (this.submitSub) { this.submitSub.unsubscribe()}

  }


}
