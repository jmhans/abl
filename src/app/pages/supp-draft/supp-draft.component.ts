
import {PlayersService } from '../../core/services/players.service';
import { Component, OnInit, OnDestroy, ViewChild , Inject, AfterViewInit, ChangeDetectionStrategy,ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { UserContextService } from './../../core/services/user.context.service';
import { UtilsService } from './../../core/utils.service';
import { MlbPlayerModel } from './../../core/models/mlb.player.model';
import { AblTeamModel } from './../../core/models/abl.team.model';
import { RosterService } from './../../core/services/roster.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {  Subscription, BehaviorSubject,  throwError as ObservableThrowError, Observable , Subject, combineLatest, scheduled, asyncScheduler, of, merge} from 'rxjs';
import { switchMap, takeUntil, mergeMap, skip, mapTo, take, map , startWith, concatAll, scan } from 'rxjs/operators';
import { DraftSseService } from 'src/app/core/services/draft-sse.service';



@Component({
  selector: 'app-supp-draft',
  templateUrl: './supp-draft.component.html',
  styleUrls: ['./supp-draft.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuppDraftComponent implements OnInit, AfterViewInit {

  pageTitle = 'Players';

  // filteredPlayers: MlbPlayerModel[];
  loading: boolean;
  error: boolean;
  query: '';
  rosterUpdateSub: Subscription;
  submitting: boolean;
  ownerTeams: AblTeamModel[];
  ownerPrimaryTeam: AblTeamModel;
  ownerSub: Subscription;
  unsubscribe$: Subject<void> = new Subject<void>();
  draftTeam: AblTeamModel;
  draftMode: boolean = true;
  advancedMode: boolean = false;
  dispStatuses: string[];

  playerSub: Subscription;
  redraw$: Observable<any>;
  fullFilter$: Observable<any>;
  selectedRow;
  counter = Array;


  colNames= ['name',  'position', 'team', 'status',  'abl_runs', 'stats.batting.gamesPlayed', 'stats.batting.atBats', 'stats.batting.hits', 'stats.batting.doubles',
             'stats.batting.triples', 'stats.batting.homeRuns', 'bb', 'stats.batting.hitByPitch', 'stats.batting.stolenBases', 'stats.batting.caughtStealing', 'action']

  teamData:any;

  resultLength: number;

  playerData$: Observable<MatTableDataSource<MlbPlayerModel>>;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  players$: Subject<MlbPlayerModel[]> = new Subject<MlbPlayerModel[]>();
  filter$: BehaviorSubject<{}> = new BehaviorSubject({});

  constructor(private title: Title,
              public utils: UtilsService,
              public api: ApiService,
              private rosterService: RosterService,
              private auth: AuthService,
              public userContext: UserContextService,
              public dialog: MatDialog,
              public players: PlayersService,
              public cdRef:ChangeDetectorRef,
              public draftSseService:DraftSseService
              ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
//    this.formData = this.api.getAblTeams$();

    this._getOwner();

    this.draftSseService
    .getServerSentEvent("/refreshDraft")
    .subscribe(data => console.log(data));
  }

    ngAfterViewInit() {

      this.redraw$ = merge(of({}), this.sort.sortChange, this.paginator.page, 3)
      this.fullFilter$ = this.filter$.pipe(
        scan((acc, curr)=> {
            for (const prop in curr) {
              acc[prop] = curr[prop]
            }

          return acc
        }, {'ablstatus': 'available'})
      )

     // this.fullFilter$.subscribe(val => console.log(`Output is: ${val}`) );
      this.playerData$ = combineLatest([this.players.allPlayers$, this.redraw$, this.fullFilter$]).pipe(
        map(([players, pageEvt, filterObj])=> {
          this.teamData = players.reduce((prev, cur) => {
            if (cur.ablstatus.ablTeam){
              let tmRec =prev.find((tm)=> {return tm._id == cur.ablstatus.ablTeam['_id']})
              if (tmRec) {
                tmRec.count++
              } else {
                prev.push({_id: cur.ablstatus.ablTeam['_id'], count : 1})
              }

            }
            return prev

          }, [])

        const adjustedPlayers = players.map((p)=> {
          if (p && p.stats && p.stats.batting) {
            p.abl_runs = this.abl(p.stats.batting)
          } else {
            p.abl_runs = null
          }
          return p

        })

          //const filteredPlayers = adjustedPlayers //.filter(this.filterer(filterObj))
          const dataSource = new MatTableDataSource<MlbPlayerModel>();

          dataSource.data =  adjustedPlayers //adjustedPlayers;
          dataSource.sortingDataAccessor = this.getSorter();
          dataSource.sort = this.sort;
          dataSource.paginator = this.paginator;

          dataSource.filterPredicate = this.getFilterer()
          dataSource.filter = JSON.stringify(filterObj)
          this.dispStatuses = dataSource.filteredData.reduce((prev: string[] ,  curr )=> {
            let retArr = prev
            if (prev.indexOf(curr.status) == -1 && curr.status) {
              prev.push(curr.status)
            }
            return prev
          }, ['Not on 40-man roster'])
          this.resultLength = dataSource.filteredData.length;

          return dataSource
      }
      ))
      this.cdRef.detectChanges();
  }


  getSorter() {


    return (obj, sortString: string) => {
      let returnVal;

      if (sortString == 'bb') {
        const battingObj = ((obj.stats || {}).batting || {})
        return battingObj.baseOnBalls + battingObj.intentionalWalks
      }

          // Split '.' to allow accessing property of nested object
      if (sortString.includes('.')) {
          const accessor = sortString.split('.');
          let value: any = obj;
          accessor.forEach((a) => {
              value = (value || {})[a];
          });
          return value;
      }
      // Access as normal
      return obj[sortString];

    }
  }

  getFilterer() {
    return (obj, filters: string) => {

        const filterObj = JSON.parse(filters)
        var criteria = [true];
        // If 'taken' show only players with ablstatus.onRoster == true
        // If 'available' show only players with ablstatus.onRoster == false || null
        // If 'all' show all players.


         for (const prop in filterObj) {
            switch (prop) {
              case 'ablstatus':
                switch (filterObj.ablstatus) {
                  case 'taken':
                    criteria.push(obj.ablstatus.onRoster == true)
                    break;
                  case 'available':
                    criteria.push(obj.ablstatus.onRoster == false )
                    break;
                  case 'all':
                    criteria.push(true)
                    break;
                  default:
                    // Show available only
                    criteria.push(obj.ablstatus.onRoster == false)
                }
                break;
              case 'position':
                switch (filterObj.position) {
                  case undefined:
                    criteria.push(true)
                    break;
                  default:
                    criteria.push(obj.eligible.indexOf(filterObj.position) != -1)
                }
                break;
              case 'status':
                switch (filterObj.status) {
                  case 'Not on 40-man roster':
                    criteria.push(typeof obj.status === 'undefined')
                    break;
                  default:
                    criteria.push((obj[prop] || '').toLowerCase().includes((filterObj[prop] || '').toLowerCase()))
                  }
                break;
              default:
                criteria.push((obj[prop] || '').toLowerCase().includes((filterObj[prop] || '').toLowerCase()))
            }
          }

          return criteria.every(Boolean)

    }
  }


addFilter(prop: string, evt) {

  var filterObj = {};
  filterObj[prop] = evt.srcElement.value;
  this.addFilterProp(filterObj)
  //this.filter$.next()
}

  addFilterProp(obj) {
    this.filter$.next(obj)
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





  _isAdmin() {
    const userProf = this.auth.userProfile;
    const roles = userProf["https://test-heroku-jmhans33439.codeanyapp.com/roles"];
    return (roles.indexOf("admin") > -1)
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

  onRowClicked(row) {
    console.log(row);
    this.selectedRow = row;
  }
  ngOnDestroy() {
    if(this.rosterUpdateSub) {
      this.rosterUpdateSub.unsubscribe();
    }


    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }



}
