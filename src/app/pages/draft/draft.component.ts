import {PlayersService } from '../../core/services/players.service';
import { Component, OnInit, NgZone ,OnDestroy, ViewChild , Inject, AfterViewInit, ChangeDetectionStrategy,ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { UserContextService } from './../../core/services/user.context.service';
import { UtilsService } from './../../core/utils.service';
import { MlbPlayerModel } from './../../core/models/mlb.player.model';
import { AblTeamModel, DraftOrderTeamModel } from './../../core/models/abl.team.model';
import { RosterService } from './../../core/services/roster.service';

import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {  Subscription, BehaviorSubject,  throwError as ObservableThrowError, Observable , Subject, combineLatest, scheduled, asyncScheduler, of, merge} from 'rxjs';
import { switchMap, takeUntil, filter, mergeMap, skip, mapTo, take, map , startWith, concatAll, scan } from 'rxjs/operators';
import { DraftSseService } from 'src/app/core/services/draft-sse.service';
import { SseService } from 'src/app/core/services/sse.service';


@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class DraftComponent implements OnInit {

  pageTitle = 'Draft';

  // filteredPlayers: MlbPlayerModel[];
  loading: boolean;
  error: boolean;
  ownerTeams: AblTeamModel[];
  ownerPrimaryTeam: AblTeamModel;
  ownerSub: Subscription;
  unsubscribe$: Subject<void> = new Subject<void>();
  draftTeam: AblTeamModel;
  dispStatuses: string[];
  draftData$ : Observable<any>
  draftData: any[];
  selectedRow;
  counter = Array;
  selectedTeam:DraftOrderTeamModel = null;
  rounds:Number[] = [...Array(23).keys()]

  colNames= ['name',  'position', 'team', 'status',  'abl_runs', 'stats.batting.gamesPlayed', 'stats.batting.atBats', 'stats.batting.hits', 'stats.batting.doubles',
             'stats.batting.triples', 'stats.batting.homeRuns', 'bb', 'stats.batting.hitByPitch', 'stats.batting.stolenBases', 'stats.batting.caughtStealing', 'action']

  teamData:any;

  resultLength: number;

  constructor(private title: Title,
    public utils: UtilsService,
    public api: ApiService,
    public rosterService: RosterService,
    private auth: AuthService,
    public userContext: UserContextService,
    public dialog: MatDialog,
    public players: PlayersService,
    public cdRef:ChangeDetectorRef,
    public draftSseService:DraftSseService,
    public SseService:SseService,
    private ngZone: NgZone
    ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    //    this.formData = this.api.getAblTeams$();

    this._getOwner();
    this.api.getAPIData$('standings')
    this.SseService.getSSE$('draft').pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
    console.log(data);
    })
    this.SseService.getSSE$('ping').pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
    console.log(data);
    })

    // this.draftSseService.getDraftResults$();
    // this.draftSseService.establishConnect(); // Now doing this step in the service after the draft results are returned.

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

    _addSkip(tm) {
    this.api.postAPIData$('skips', [{ablTeam: tm._id}]).pipe(takeUntil(this.unsubscribe$)).subscribe((data)=> {
    console.log("Pick Skipped")
    })
  }

  onRowClicked(row) {
    console.log(row);
    this.selectedRow = row;
  }
  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  playersDrafted(roster:any[]){
    if (!roster) return null;

    return roster.reduce((accum, curVal)=> {
    if (curVal.player.ablstatus.acqType == 'draft') {
    return accum+1;
    }
    return accum;
    }, 0)
  }


}


