import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { RosterService } from './../../../core/services/roster.service';
import { LineupModel , LineupCollectionModel} from './../../../core/models/lineup.model';
import { MlbPlayerModel } from './../../../core/models/mlb.player.model';
import { Subscription, Subject } from 'rxjs';
import { RosterRecordModel } from './../../../core/models/roster.record.model';
import { AuthService } from './../../../auth/auth.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';

import { FormControl } from '@angular/forms';


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
  
  lineup: LineupCollectionModel;
  edit_lineup: boolean;
  active_roster : LineupModel;
  active_roster_index: number = 0;
  active_roster_is_current: boolean;
  active_effective_date: FormControl;
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
  }
  
  
  _isTeamOwner() {
    const userSub = this.auth.userProfile.sub;
    const ownerMatch = this.team.owners.find((o)=> {return o.userId == userSub});
    
    if (ownerMatch) {
      return true;
    } else {
      return false;
    }
    

  }
  
  _isAdmin() {
    const userSub = this.auth.userProfile.sub; 
    const roles = userSub["https://test-heroku-jmhans33439.codeanyapp.com/roles"];
    return (roles.indexOf("admin") > -1)
  }

  editable() {
    return this._isTeamOwner() && (this.active_roster_is_current || this._isAdmin);
  }
  
  private _getRosterRecords() {
    this.loading = true;
    
    this.lineupSub = this.rosterService
      .getLineupByTeamId$(this.team._id)
      .subscribe(
        res => {
          this._handleLineupSuccess(res, false);
        }, 
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
     );
  }
  
//   active_lineup() {
//    return this.active_lineup_idx == 0 ? this.lineup : this.lineup.priorRosters[this.active_lineup_idx - 1];
//   }

  toggleLineup(event : any) {
    
    this.active_roster_index = event.value;
    this.active_roster_is_current = (this.active_roster_index == 0)
    this.active_roster = this.active_roster_is_current ? this.lineup : this.lineup.priorRosters[this.active_roster_index - 1];
    
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
  
  
  private _updateRoster(result) {
    if (result.success) {
      this._handleLineupSuccess(result.data, true);
    } else {
      this._handleUpdateError(result.err);
    }
  }
  
  
  private _handleLineupSuccess(res, update) {
    this.error = false;
    this.loading = false;
    if (update) {
      this.alerts.push({type: 'success', message:'Lineup saved successfully'}) ;
    }
    var activeRec = res;
    
    activeRec.roster.forEach((rr) => {rr.originalPosition = rr.lineupPosition});
    activeRec.priorRosters.forEach((roster)=> {roster.roster.forEach((rr)=> {rr.originalPosition = rr.lineupPosition} )})
    this.lineup = activeRec; 
    this.active_roster = this.active_roster_index > 0 ? this.lineup.priorRosters[this.active_roster_index - 1] : this.lineup
    this.active_effective_date = new FormControl(new Date(this.active_roster.effectiveDate));
  }
  
  
  private _handleUpdateError(err) {
    console.error(err);
    this.alerts.push({type:'danger', message:'Lineup not saved'});
    this.error = true;
  }
  
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
  
  formatLabel(lineup) {
    
    return (value: number)=> {
      if (lineup) {
        
        const dt = new Date(value > 0 ? lineup.priorRosters[value-1]["effectiveDate"] : lineup.effectiveDate);
        return  dt.toLocaleDateString()
      } 
      
    }

    
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


