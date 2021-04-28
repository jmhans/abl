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
  formDate: FormControl;
  roster_editable: boolean;
  edit_lineup: boolean;
  
  active_roster : LineupModel;
  lineupSub: Subscription;
  saveRosterRecordSub: Subscription;
  loading: boolean;
  error: boolean;
  saveLineupSub: Subscription;
  message: string = '';
  alerts: Alert[] = [];
  events: string[] = [];
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  
  dlOptions: any;
  
  
  
  constructor(  private router: Router, 
                private route: ActivatedRoute,
                public auth: AuthService,
                public rosterService: RosterService,
                private utils: UtilsService
                ) { }

  ngOnInit() {
    this._routeSubs();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    
    // option veriable
    this.dlOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: false,
      headers: [],
      showTitle: false,
      title: this.team.nickname,
      useBom: false,
      removeNewLines: true,
      keys: ['rosterOrder', 'lineupPosition','playerName','playerTeam', 'mlbID', 'dougstatsName']
    };


  }
  
  dlFileName() {
    return this.team.nickname + '_Lineup_' + this.actualRosterEffectiveDate(this.current_roster.effectiveDate).toISOString().substring(0, 10)
  }
  
  currentRosterDate() {
    return this.actualRosterEffectiveDate(new Date())
  }
  
  private _routeSubs() {
    
    // Subscribe to query params to watch for tab changes
     var that = this;
    this.paramSub = this.route.queryParams
      .subscribe(queryParams => {
        this.roster_date = queryParams['dt'] ? new Date(queryParams['dt']) : new Date();
        this.roster_deadline = this.actualRosterEffectiveDate(this.roster_date)
        this.formDate = new FormControl(this.roster_deadline)
      
        this._getRosterRecords();
      });
  }
  
  actualRosterEffectiveDate(curDt) {
    //var curDt = this.current_roster.effectiveDate
    if (typeof(curDt) == 'string') { curDt = new Date(curDt)} //Assume it's an ISODate string, and convert it for rest of function call. 
    
    var globalrosterDeadline = new Date(curDt.getFullYear() + "-" + (curDt.getMonth()+1).toString() + "-" + curDt.getDate() + " " + this.editTimeLimit)
    if (globalrosterDeadline < curDt) {
      globalrosterDeadline.setDate(globalrosterDeadline.getDate() +1)
    }
    return this.utils.changeTimezone(globalrosterDeadline, this.editTimeLimitInantz)
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
   return (this._isTeamOwner() && (new Date() < this.roster_deadline)) || this.edit_lineup
  }
  
  
  _date_changed(ev) {
    
    this.router.navigate(
      [], 
      {
        relativeTo: this.route,
        queryParams: { dt: ev.value.toISOString() },
        queryParamsHandling: 'merge'
      });
  }

  
  
  _isAdmin() {
    const userProf = this.auth.userProfile; 
    const roles = userProf["https://test-heroku-jmhans33439.codeanyapp.com/roles"];
    return (roles.indexOf("admin") > -1)
  }

 
  private _getRosterRecords() {
    this.loading = true;
    
    this.lineupSub = this.rosterService
      .getLineupForTeamAndDate$(this.team._id, this.roster_deadline)
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
  
  _set_Active_Roster() { 
      this.active_roster = this.lineup
      this.current_roster = new LineupFormModel(
        this.lineup._id, 
        this.active_roster._id, 
        this.active_roster.roster.map((rr)=> {return {player: rr.player, lineupPosition: rr.lineupPosition, rosterOrder: rr.rosterOrder}}), 
        new Date(this.roster_deadline)
      );
  }

  
  ngOnDestroy() {
    this.lineupSub.unsubscribe();
    if (this.saveLineupSub) {
      this.saveLineupSub.unsubscribe();
    }
  }

  
  
  _getDLFile() {
    return this.current_roster.roster.map((p)=> {
      return {
        playerName: p.player.name, 
        playerTeam: p.player.team, 
        mlbID: p.player.mlbID, 
        lineupPosition: p.lineupPosition, 
        rosterOrder: p.rosterOrder,
        dougstatsName: p.player.dougstatsName || p.player.name
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
  
  
  private _createNewRoster(evt) {
    if (evt.lineup) {
    const newRec = {
      ablTeam: this.team._id, 
      roster: evt.lineup.roster, 
      effectiveDate: evt.lineup.effectiveDate
    }
      
      
        // editing lineup for the roster_deadline date   
      this.saveRosterRecordSub = this.rosterService
        .updateRosterRecord$(this.team._id, newRec)
        .subscribe(
          data => this._handleLineupSuccess(data, true),
          err => this._handleUpdateError(err)
        )
         
    }
  }
  
  private _dropPlayer(evt) {
    if (evt.playerId) {
      this.saveRosterRecordSub = this.rosterService
        .dropPlayerFromTeam$(this.team._id, evt.playerId)
        .subscribe(
          data => {if (data.success) {
                this.router.navigate([])
          }}, 
          err => this._handleUpdateError(err)
        
      )
    }
  }

  
  private _handleLineupSuccess(res, update) {
    this.error = false;
    this.loading = false;
    if (update) {
      this.alerts.push({type: 'success', message:'Lineup saved successfully'}) ;
    }
    this.lineup = res;
    this._set_Active_Roster() //this.active_roster_index);
        
  }
  
  
  private _handleUpdateError(err) {
    console.error(err);
    this.alerts.push({type:'danger', message:'Lineup not saved'});
    this.error = true;
  }
  
  close(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
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
  
  
  
    download(){
    this.downloadFile2(this._getDLFile(), this.dlFileName());
  }

  
     downloadFile2(data, filename='data') {
        let csvData = this.ConvertToCSV(data, ['rosterOrder', 'lineupPosition','playerName','playerTeam', 'mlbID', 'dougstatsName']);
        
        let blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
        let dwldLink = document.createElement("a");
        let url = URL.createObjectURL(blob);
        let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
        if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
            dwldLink.setAttribute("target", "_blank");
        }
        dwldLink.setAttribute("href", url);
        dwldLink.setAttribute("download", filename + ".csv");
        dwldLink.style.visibility = "hidden";
        document.body.appendChild(dwldLink);
        dwldLink.click();
        document.body.removeChild(dwldLink);
    }

    ConvertToCSV(objArray, headerList) {
         let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
         let str = '';
         let row = 'S.No,';

         for (let index in headerList) {
             row += headerList[index] + ',';
         }
         row = row.slice(0, -1);
         str += row + '\r\n';
         for (let i = 0; i < array.length; i++) {
             let line = (i+1)+'';
             for (let index in headerList) {
                let head = headerList[index];

                 line += ',' + array[i][head];
             }
             str += line + '\r\n';
         }
         return str;
     }
  
  

}


