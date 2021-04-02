// src/app/pages/player/players.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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

  
  displayedColumns: string[] = ['name', 'mlbID', 'ablTeam', '_id', 'position', 'team', 'status', 'abl', 'gamesPlayed', 'atBats', 'hits', 'doubles', 'triples', 'homeRuns', 'baseOnBalls', 'hitByPitch', 'stolenBases', 'caughtStealing', 'action'];
  dataSource: MatTableDataSource<MlbPlayerModel>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  
  
  constructor(private title: Title, 
              public utils: UtilsService, 
              private api: ApiService, 
              public fs: FilterSortService, 
              private rosterService: RosterService, 
              private auth: AuthService, 
              public userContext: UserContextService) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    
    this.dtOptions = {
      pagingType: 'full_numbers', 
      pageLength: 50, 
      responsive: true
    }
    this._getPlayerList();
    this._getOwner();

  }
  
  private _getPlayerList() {
    this.loading = true;
    // Get future, public events
    this.playerListSub = this.api
      .getMlbPlayers$()
      .subscribe(
        res => {
          this.playerList = res;
          this.dataSource = new MatTableDataSource(this.playerList);
          this.dataSource.paginator = this.paginator;
          
           this.dataSource.sortingDataAccessor = (item, property) => {
            
             switch(property) {

                case 'abl': return this.abl(item.stats['batting']);
                default: 
                  if (typeof item[property] == 'undefined') {
                    return item.stats['batting'][property];
                  } else {
                    return item[property];
                  }
              }
            };

          this.dataSource.sort = this.sort;
          this.filteredPlayers = res;
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
  
  
  _addPlayerToTeam(plyr) {
      this.rosterUpdateSub = this.rosterService
        .addPlayertoTeam$(plyr, this.ownerPrimaryTeam._id)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
  }


  
  searchPlayers() {
    this.filteredPlayers = this.fs.search(this.playerList, this.query, '_id', 'mediumDate');
  }

  resetQuery() {
    this.query = '';
    this.filteredPlayers = this.playerList;
  }
  
   private _handleSubmitSuccess(res) {
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
              plyrStats.homeRuns * 40 + 
              plyrStats.baseOnBalls * 10 + 
              plyrStats.intentionalWalks * 10 + 
              plyrStats.stolenBases * 7 + 
              plyrStats.caughtStealing * (-7)  + 
              (plyrStats.sacBunts + plyrStats.sacFlies) * 5) / plyrStats.atBats - 4.5  
    } else {
      return 0;
    }
    
  }
  

  ngOnDestroy() {
    this.playerListSub.unsubscribe();
    this.dtTrigger.unsubscribe();
    if(this.rosterUpdateSub) { 
      this.rosterUpdateSub.unsubscribe();
    }
    
        
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}