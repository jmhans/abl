import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { RosterService } from './../../../core/services/roster.service';
import { LineupModel , LineupCollectionModel, LineupFormModel} from './../../../core/models/lineup.model';
import { Subscription, Subject } from 'rxjs';
import { RosterRecordModel } from './../../../core/models/roster.record.model';
import { AuthService } from './../../../auth/auth.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilsService } from './../../../core/utils.service';

import {MatDatepickerInputEvent} from '@angular/material/datepicker';

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
  
  editTimeLimit: string = "12:00:00";
  editTimeLimitInantz: string = "America/Chicago"
  
  
  lineup: LineupCollectionModel;
  current_roster: LineupFormModel;
  paramSub: Subscription;
  roster_date: Date;
  roster_deadline: Date;
  roster_editable: boolean;
  edit_lineup: boolean;
  
  create_lineup: boolean;
  active_roster : LineupModel;
  active_roster_index: number = 0;
  active_roster_is_current: boolean;
  lineupSub: Subscription;
  loading: boolean;
  error: boolean;
  saveLineupSub: Subscription;
  message: string = '';
  alerts: Alert[] = [];
  events: string[] = [];
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  
  options: any;
  
  
  
  
  
  constructor(  private router: Router, 
                private route: ActivatedRoute,
                public auth: AuthService,
                public rosterService: RosterService,
                private utils: UtilsService
                ) { }

  ngOnInit() {
    this._routeSubs();
    
    
  // option veriable
  this.options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: false,
    headers: [],
    showTitle: true,
    title: this.team.nickname,
    useBom: false,
    removeNewLines: true,
    keys: ['playerName','playerTeam', 'mlbID', 'lineupPosition','rosterOrder' ]
  };
  

  }
  
  private _routeSubs() {
    
    // Subscribe to query params to watch for tab changes
     var that = this;
    this.paramSub = this.route.queryParams
      .subscribe(queryParams => {
        this.roster_date = queryParams['dt'] ? new Date(queryParams['dt']) : new Date();
          console.log(this.roster_date);
          var mnth = this.roster_date.getMonth()+1;
        
          var globalrosterDeadline = new Date(this.roster_date.getFullYear() + "-" + mnth.toString() + "-" + this.roster_date.getDate() + " " + this.editTimeLimit)
          this.roster_deadline = this.utils.changeTimezone(globalrosterDeadline, this.editTimeLimitInantz)
          console.log(this.roster_deadline); 

        this._getRosterRecords();
      });
  }
  
    

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.events.push(`${type}: ${event.value}`);
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
  
  editable() {
   return this._isTeamOwner() && ((new Date() < this.roster_deadline) || this.edit_lineup)
  }
  
  
  _date_changed(ev) {
    console.log(ev);
    
    this.router.navigate(
      [], 
      {
        relativeTo: this.route,
        queryParams: { dt: ev.value.toISOString() },
        queryParamsHandling: 'merge'
      });
  }
  _createNew() {
    this.create_lineup = !this.create_lineup;
    this._set_Active_Roster(-1);
  }
  
  
  _isAdmin() {
    const userProf = this.auth.userProfile; 
    const roles = userProf["https://test-heroku-jmhans33439.codeanyapp.com/roles"];
    return (roles.indexOf("admin") > -1)
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
  
  _set_Active_Roster(idx) {
    var i = 0;
    if (this.roster_deadline < new Date(this.lineup.effectiveDate)) {
      while (this.roster_deadline < new Date(this.lineup.priorRosters[i].effectiveDate) && i<this.lineup.priorRosters.length) {
        i++
      }
      this.active_roster = this.lineup.priorRosters[i]
      this.current_roster = new LineupFormModel(
          this.lineup._id, 
          this.active_roster._id, 
          this.active_roster.roster.map((rr)=> {return {player: rr.player, lineupPosition: rr.lineupPosition, rosterOrder: rr.rosterOrder}}), 
          this.active_roster.effectiveDate
      );
    } else {
      this.active_roster = this.lineup
      this.current_roster = new LineupFormModel(
        this.lineup._id, 
        null, 
        this.active_roster.roster.map((rr)=> {return {player: rr.player, lineupPosition: rr.lineupPosition, rosterOrder: rr.rosterOrder}}), 
        this.roster_deadline
      );
    }
    
    
    
  }

  toggleLineup(event : any) {
    this._set_Active_Roster(event.value);
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
  
  
  _getDLFile() {
    return this.current_roster.roster.map((p)=> {
      return {
        playerName: p.player.name, 
        playerTeam: p.player.team, 
        mlbID: p.player.mlbID, 
        lineupPosition: p.lineupPosition, 
        rosterOrder: p.rosterOrder
    }})
  }
 
  downloadFile(data: any) {
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(data[0]);
    const csv = data.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = 'myFile.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
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
    this.lineup = res;
    this._set_Active_Roster(this.active_roster_index);
        
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


