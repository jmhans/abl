import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { RosterService } from './../../../core/services/roster.service';
import { LineupModel } from './../../../core/models/lineup.model';
import { MlbPlayerModel } from './../../../core/models/mlb.player.model';
import { Subscription, Subject } from 'rxjs';
import { RosterRecordModel } from './../../../core/models/roster.record.model';
import { AuthService } from './../../../auth/auth.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';

interface Alert {
  type: string;
  message: string;
}


@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.scss']
})
export class RosterComponent implements OnInit, OnDestroy {
  @Input() team: AblTeamModel;
  editable: boolean;
  lineup: LineupModel;
  lineupSub: Subscription;
  loading: boolean;
  error: boolean;
  saveLineupSub: Subscription;
  message: string = '';
  alerts: Alert[] = [];
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  constructor(  public auth: AuthService,
                public rosterService: RosterService
                ) { }

  ngOnInit() {
    this._getRosterRecords();
    this.editable = this._isTeamOwner();
  }
  
  private _isTeamOwner() {
    this.team.owners.forEach((owner) => {
      if (this.auth.userProfile.sub == owner.userId) {
        return true;
      }
    });
    return false;
  }

  
  private _getRosterRecords() {
    this.loading = true;
    
    this.lineupSub = this.rosterService
      .getLineupByTeamId$(this.team._id)
      .subscribe(
        res => {
          res.roster.forEach((rr) => {rr.originalPosition = rr.lineupPosition});
          this.lineup = res;
          this.loading = false;
        }, 
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
     );
  }
  

  ngOnDestroy() {
    this.lineupSub.unsubscribe();
    if (this.saveLineupSub) {
      this.saveLineupSub.unsubscribe();
    }
  }
  
  dropLineupRecord(event: CdkDragDrop<any>) {
    moveItemInArray(this.lineup.roster, event.previousIndex, event.currentIndex);
  }
  
  _updateRoster() {
    var diffs = false;
    for (var j =0; j<this.lineup.roster.length; j++) {
      var rr = this.lineup.roster[j]
      if (rr.rosterOrder != (j+1) || rr.lineupPosition != rr.originalPosition) {
        diffs = true;
        rr.rosterOrder = j+1;
      }
    }
    if (diffs) {
      this.saveLineupSub = this.rosterService
        .updateLineup$(this.lineup._id, this.lineup)
        .subscribe(
          data => this._handleUpdateSuccess(data),
          err => this._handleUpdateError(err)
      )      
    }

  }
  
  private _handleUpdateSuccess(res) {
    this.error = false;
    this.loading = false;
    this.alerts.push({type: 'success', message:'Lineup saved successfully'}) ;
    
  }
  
  private _handleUpdateError(err) {
    console.error(err);
    this.alerts.push({type:'danger', message:'Lineup not saved'});
    this.error = true;
  }
  
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
  
  rosterChanged () {
  var diffs = false;
    if (this.lineup) {
      for (var j =0; j<this.lineup.roster.length; j++) {
        if (
          this.lineup.roster[j].rosterOrder != (j+1) ||
          this.lineup.roster[j].originalPosition != this.lineup.roster[j].lineupPosition
           ) {
          return true;
        }
      }  
    }
    
    return false;
  }
  
  abl(plyrStats) { 
    return (plyrStats.hits * 25 + 
       plyrStats.doubles * 10 + 
            plyrStats.triples * 20 +
            plyrStats.homeRuns * 40 + 
            plyrStats.baseOnBalls * 10 + 
            plyrStats.intentionalWalks * 10 + 
            plyrStats.stolenBases * 7 + 
            plyrStats.caughtStealing * (-7)  + 
            (plyrStats.sacBunts + plyrStats.sacFlies) * 5) / plyrStats.atBats - 4.5
  }
  
  

}


