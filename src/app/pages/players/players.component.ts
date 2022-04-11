// src/app/pages/player/players.component.ts
import { Component, OnInit, OnDestroy, ViewChild , Inject} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { UserContextService } from './../../core/services/user.context.service';
import { UtilsService } from './../../core/utils.service';
import { ActivatedRoute } from '@angular/router';
import { MlbPlayerModel } from './../../core/models/mlb.player.model';
import { AblTeamModel } from './../../core/models/abl.team.model';
import { RosterRecordModel } from './../../core/models/roster.record.model';
import { FilterSortService } from './../../core/filter-sort.service';
import { RosterService } from './../../core/services/roster.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {  Subscription, BehaviorSubject,  throwError as ObservableThrowError, Observable , Subject} from 'rxjs';
import { switchMap, takeUntil, mergeMap, skip, mapTo, take, map } from 'rxjs/operators';
import {MatDialog ,MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormControl} from '@angular/forms';
import { DataTableDirective } from 'angular-datatables';

export interface DialogData {
  team: AblTeamModel;
  player: string;
  effective_date: Date;
  acqType: string;
}

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit, OnDestroy {
  pageTitle = 'Players';
  playerListSub: Subscription;
  playerList: MlbPlayerModel[];
  filteredPlayers: MlbPlayerModel[];
  loading: boolean;
  error: boolean;
  query: '';
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  actionPlayer: MlbPlayerModel;
  rosterUpdateSub: Subscription;
  submitting: boolean;
  takenFilter: boolean;
  ownerTeams: AblTeamModel[];
  ownerPrimaryTeam: AblTeamModel;
  ownerSub: Subscription;
  unsubscribe$: Subject<void> = new Subject<void>();
  draftTeam: AblTeamModel;
  draftMode: boolean = false;
  teamList: AblTeamModel[];
  teamsListSub: Subscription;
  showTaken: boolean = false;
  filterGroup: any = {value: 'showAll'};
  showPlayers: string = 'all';
  advancedMode: boolean = false; 
  filterPos: string;
  
  overrideData: any[];
  dataSub: Subscription;

  animal: string;
  name: string;
  
  
  
  displayedColumns: string[] = ['name', 'mlbID', 'ablTeam', '_id', 'position', 'team', 'status', 'abl', 'gamesPlayed', 'atBats', 'hits', 'doubles', 'triples', 'homeRuns', 'baseOnBalls', 'hitByPitch', 'stolenBases', 'caughtStealing', 'action'];
  dataSource: MatTableDataSource<MlbPlayerModel>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(DataTableDirective, {static: false})
  dtElement: DataTableDirective;
  
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  formData : Observable<Array<any>>;



  
  constructor(private title: Title, 
              public utils: UtilsService, 
              public api: ApiService, 
              public fs: FilterSortService, 
              private rosterService: RosterService, 
              private auth: AuthService, 
              public userContext: UserContextService,
              public dialog: MatDialog
              ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this.formData = this.api.getAblTeams$();
    this.dtOptions = {
      pagingType: 'full_numbers', 
      pageLength: 50, 
      responsive: true
    }
    this._getPlayerList();
    this._getOwner();
    //this._getOverride();
  }
  
  private _getPlayerList() {
    this.loading = true;
    // Get future, public events
    
    this.playerListSub = this.api
      .getMlbPlayers$()
      .subscribe(
        res => {
          this.playerList = res;
          this.filteredPlayers = this.playerList;
     //     this.dataSource = new MatTableDataSource(this.filteredPlayers);
     //     this.dataSource.paginator = this.paginator;
          
     //      this.dataSource.sortingDataAccessor = (item, property) => {
            
//              switch(property) {

//                 case 'abl': return this.abl(item.stats['batting']);
//                 default: 
//                   if (typeof item[property] == 'undefined') {
//                     return item.stats['batting'][property];
//                   } else {
//                     return item[property];
//                   }
//               }
//             };
          //this._getTeamList();
//          this.dataSource.sort = this.sort;
          this.updateTakenPlayers('all');
          this.loading = false;
          this.dtTrigger.next();
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }
  

  
  
  
  _getOwner() {
    this.ownerSub = this.userContext.teams$.pipe(takeUntil(this.unsubscribe$)).subscribe(
      data => {
        this.ownerTeams = data
        this.ownerPrimaryTeam = data.length ? data[0] : '';
      }, 
      err => console.log(err)
    )
  }
  
  _selectedItems() {
    return this.playerList.filter((p)=> {return p.draftMe}).length
    
  }
  
  _getOverride() {
    this.dataSub = this.api.getData$("draft").subscribe(
      data => {
        this.overrideData = data
        
      }
    )
  }
  
  _updateSelectionsWithOverride(tmNickname) {
    var matchList = this.overrideData.filter((draft) => {
      return draft.Team == tmNickname
    })
    
    this.playerList.forEach((p) => {
      if (p.name == "Cody Bellinger") {
        console.log(p)
      }
      var match = matchList.find((m)=> {return m.mlbId == p.mlbID})
      // There is a match, so this guy was selected by the tm in the draft. 
      if (match) {
        p.draftMe = true
      } else {
        p.draftMe = false
      }
      
    })
  }
  
  
  
  _isAdmin() {
    const userProf = this.auth.userProfile; 
    const roles = userProf["https://test-heroku-jmhans33439.codeanyapp.com/roles"];
    return (roles.indexOf("admin") > -1)
  }
  
  
  _addPlayerToTeam(plyr) {
    
    if (this.advancedMode) {
      const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
        width: '250px',
        data: {player: plyr.name, team: this.ownerPrimaryTeam, effective_date: new Date(), acqType: 'pickup'}
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        console.log(result)
        
        if (result) {
          this.rosterUpdateSub = this.rosterService
          .addPlayertoTeam$({player: plyr, effective_date: result.effective_date.toISOString(), acqType: result.acqType}, result.team._id)
          .subscribe(
            data => this._handleSubmitSuccess(data, plyr),
            err => this._handleSubmitError(err)
          );           
        }
 
      });
    } else {
       
     this.rosterUpdateSub = this.rosterService
        .addPlayertoTeam$({player: plyr}, this.ownerPrimaryTeam._id)
        .subscribe(
          data => this._handleSubmitSuccess(data, plyr),
          err => this._handleSubmitError(err)
        );  
    }
    
 
  }

  
//   searchPlayers() {
//     this.filteredPlayers = this.fs.search(this.playerList, this.query, '_id', 'mediumDate');
//   }
  
  updateTakenPlayers(filterType: string) {
//     if (this.showTaken) {
//       this.filteredPlayers = this.playerList
//     } else {
//       this.filteredPlayers = this.playerList.filter((p)=> {return p.ablstatus.onRoster == this.showTaken})  
//     }
    
    this.filteredPlayers = this.playerList.filter((p) => {
      return (p.ablstatus.onRoster == (filterType == 'taken')) || filterType == "all"
    })
    
  }
  
  
  changePositionFilter() {
    this.filteredPlayers = this.playerList.filter((p) => {
      
      if (this.filterPos) {
        return  p.position == this.filterPos && ((p.ablstatus.onRoster == (this.showPlayers == 'taken')) || this.showPlayers == 'all')  
      } else {
        return  ((p.ablstatus.onRoster == (this.showPlayers == 'taken')) || this.showPlayers == 'all')  
      }
      
    })
    this.rerender()

  }
                                                  
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }
  

  resetQuery() {
    this.query = '';
    this.filteredPlayers = this.playerList;
  }
  
   private _handleSubmitSuccess(res, plyr) { 
    plyr.ablstatus = res.player.ablstatus;
    this.error = false;
    this.submitting = false;
  }

  private _handleSubmitError(err) {
    console.error(err);
    this.submitting = false;
    this.error = true;
  }
  abl(plyrStats) { 
    if(plyrStats.atBats >0) {
      return (plyrStats.hits * 25 + 
         plyrStats.doubles * 10 + 
              plyrStats.triples * 20 +
              plyrStats.homeRuns * 30 + 
              plyrStats.baseOnBalls * 10 + 
              plyrStats.hitByPitch * 10 + 
              plyrStats.stolenBases * 7 + 
              plyrStats.caughtStealing * (-7)  + 
              (plyrStats.sacBunts + plyrStats.sacFlies) * 5) / plyrStats.atBats - 4.5  
    } else {
      return 0;
    }
    
  }
  
   
  openDialog(): void {
    
    if (this.advancedMode) {
      
    }
    

  }
  

  ngOnDestroy() {
    this.playerListSub.unsubscribe();
    //this.dataSub.unsubscribe();
    this.dtTrigger.unsubscribe();
    if(this.rosterUpdateSub) { 
      this.rosterUpdateSub.unsubscribe();
    }
    
        
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'playerAddDialog.html',
})
export class DialogOverviewExampleDialog {
date = new FormControl(new Date());
teamList$ = this.api.getAblTeams$()
acqType: string;
  
  
  constructor(public api: ApiService, 
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
 
  
  

}


