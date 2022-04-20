import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { RosterService } from './../../../core/services/roster.service';
import { LineupModel , LineupCollectionModel, LineupFormModel} from './../../../core/models/lineup.model';
import { Subscription, Subject, combineLatest, Observable } from 'rxjs';
import { takeUntil, combineAll , map, switchMap } from 'rxjs/operators';

import { RosterRecordModel } from './../../../core/models/roster.record.model';
import { AuthService } from './../../../auth/auth.service';
import { LeagueConfigService } from './../../../core/services/league-config.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilsService } from './../../../core/utils.service';
import {MatDialog ,MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {MatDatepickerInputEvent} from '@angular/material/datepicker';
import { RosterImportComponent } from './roster-import/roster-import.component'


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
  
  //editTimeLimit: string;
  //editTimeLimitInantz: string;
  leagueSub: Subscription;
  
  currRosterEffDate: Date;
  
  lineup: LineupCollectionModel;
  current_roster: LineupFormModel;
  paramSub: Subscription;
  
  roster_date$: Observable<Date>;
  roster_deadline$: Observable<Date>;
  formDate$: Observable<FormControl>;
  current_roster_deadline$: Observable<Date>;
  current_roster$: Observable<LineupFormModel>;
  lineup$: Observable<LineupCollectionModel>;
  
  roster_date: Date;
  roster_deadline: Date;
  formDate: FormControl;
  
  roster_editable: boolean;
  edit_lineup: boolean;
  csvLineupInput: string;
  active_roster : LineupModel;
  lineupSub: Subscription;
  saveRosterRecordSub: Subscription;
  saveLineupSub: Subscription;
  message: string = '';
  alerts: Alert[] = [];
  events: string[] = [];
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  
  dlOptions: any;
  dlFileName: string ;
  
    unsubscribe$: Subject<void> = new Subject<void>();

  
  
  constructor(  private router: Router, 
                private route: ActivatedRoute,
                public auth: AuthService,
                public rosterService: RosterService,
                private utils: UtilsService,
                 public dialog: MatDialog,
                 public leagueConfig: LeagueConfigService, 
                 private _rosterWarning: MatSnackBar

                ) { }

  ngOnInit() {
    
    this.roster_date$ = this.route.queryParams.pipe(map((qp)=> {
      return qp['dt'] ? new Date(qp['dt']) : new Date();  
    }))
    
    this.roster_deadline$ = combineLatest(this.leagueConfig.league$, this.roster_date$).pipe(map(([lg, rd])=> {
      // this.editTimeLimit = lg.rosterLockTime
      // this.editTimeLimitInantz = lg.rosterLockTimeZone
      var rosterEffDate = this.actualRosterEffectiveDate(rd, lg.rosterLockTime, lg.rosterLockTimeZone)
      this.dlFileName = this.team.nickname + '_Lineup_' + rosterEffDate.toISOString().substring(0, 10)
      this.roster_deadline = rosterEffDate
      return rosterEffDate
    }))
    
    this.formDate$ = this.roster_deadline$.pipe(map((deadline)=> {
      return new FormControl(deadline)
    }))
    
    this.current_roster_deadline$ = this.leagueConfig.league$.pipe(map((lg)=> {
      return this.actualRosterEffectiveDate(new Date(), lg.rosterLockTime, lg.rosterLockTimeZone)
    }))
    
    this.lineup$ = this.roster_deadline$.pipe(switchMap((deadline)=> {
      return this.rosterService.getLineupForTeamAndDate$(this.team._id, deadline)
    }))
    
    this.current_roster$ = combineLatest(this.lineup$, this.roster_deadline$).pipe(map(([lineup, deadline])=>{
            this.active_roster = lineup;
            this.current_roster = new LineupFormModel(
              lineup._id, 
              this.active_roster._id, 
              this.active_roster.roster.map((rr)=> {return {player: rr.player, lineupPosition: rr.lineupPosition, rosterOrder: rr.rosterOrder}}), 
              new Date(deadline)
            );
            return this.current_roster
    }))
    
    
    //this.getLeagueInfo();
    
    //this._routeSubs();
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
  
  
  submitCSV() {
    
    const dialogRef = this.dialog.open(RosterImportComponent, {
        width: '60%',
        data: {actualLineup: this.current_roster}
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        if (result) {
          console.log(result)
          this.current_roster = result
        }
        
 
      });
    
    
    
    
  }
  

  
 
  actualRosterEffectiveDate(curDt, deadlineTime, deadlineTimeZone) {
    //var curDt = this.current_roster.effectiveDate
    if (typeof(curDt) == 'string') { curDt = new Date(curDt)} //Assume it's an ISODate string, and convert it for rest of function call. 
    
    var globalrosterDeadline = new Date(curDt.getFullYear() + "-" + (curDt.getMonth()+1).toString() + "-" + curDt.getDate() + " " + deadlineTime)
    if (globalrosterDeadline < curDt) {
      globalrosterDeadline.setDate(globalrosterDeadline.getDate() +1)
    }
    return this.utils.changeTimezone(globalrosterDeadline, deadlineTimeZone)
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

 
  
  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    
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
        .updateRoster(this.team._id, newRec)
        .subscribe(
          data => {   
            this.alerts.push({type: 'success', message:'Lineup saved successfully'})
            //this.lineup = data;
            //this._set_Active_Roster() //this.active_roster_index);
          },
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
  
  private _rosterAlert(evt) {
    
    this.alerts.push({type: 'danger', message: evt.message})

  }

  _showRosterWarning(message: string) {
    this._rosterWarning.open(message, 'dismiss', {
      duration: 3000
    });
  }
  
  
  private _handleUpdateError(err) {
    console.error(err);
    
    this._rosterWarning.open('Lineup not saved.', 'Okay');
    this.alerts.push({type:'danger', message:'Lineup not saved'});
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
    this.downloadFile2(this._getDLFile(), this.dlFileName);
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
  
  

}


