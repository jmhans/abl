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

import {  Subscription,   throwError as ObservableThrowError, interval, Observable , Subject, of, merge} from 'rxjs';
import {  takeUntil, combineLatestWith , map} from 'rxjs/operators';
import { DraftSseService } from 'src/app/core/services/draft-sse.service';
import { SseService } from 'src/app/core/services/sse.service';
import { LineupModel } from 'src/app/core/models/lineup.model';


@Component({
  selector: 'app-supp-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['../draft/draft.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class SuppDraftComponent implements OnInit {

  pageTitle = 'Draft';

  // filteredPlayers: MlbPlayerModel[];
  public now: Date = new Date();
  loading: boolean;
  error: boolean;
  ownerTeams: AblTeamModel[];
  ownerPrimaryTeam: AblTeamModel;
  ownerSub: Subscription;
  rosterUpdateSub: Subscription;
  unsubscribe$: Subject<void> = new Subject<void>();
  draftTeam: AblTeamModel;
  dispStatuses: string[];
  selectedRow;
  counter = Array;
  selectedTeam:DraftOrderTeamModel = null;
  rounds:Number[] = [...Array(23).keys()]

  colNames= ['name',  'position', 'team', 'status',  'abl_runs', 'stats.batting.gamesPlayed', 'stats.batting.atBats', 'stats.batting.hits', 'stats.batting.doubles',
             'stats.batting.triples', 'stats.batting.homeRuns', 'bb', 'stats.batting.hitByPitch', 'stats.batting.stolenBases', 'stats.batting.caughtStealing', 'action']

  teamData:any;

  resultLength: number;

  preDraftRosters$:Observable<any[]>  = this.rosterService.activeRosters$.pipe(map((rosters: LineupModel[])=> {
    let origRoster = rosters.map(r=> r.roster.filter((p)=> p.player.ablstatus.acqType == 'draft'));
    return origRoster
  }))




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
              ) {

                setInterval(() => {
                  this.now = new Date()
                }, 1000);
               }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);

    this._getOwner();
    this.api.getAPIData$('standings')
    this.SseService.getSSE$('draft').pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      console.log(data);
    })
    this.SseService.getSSE$('ping').pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      console.log(data);
    })


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
    this.rosterService.refreshSkips()

    })



  }

  _skipPick(_id:string) {
    this.api.putAPIData$('draftpicks', _id,  {"status": "Skipped"}).pipe(takeUntil(this.unsubscribe$)).subscribe((data)=> {
    console.log("Pick Skipped")
    this.rosterService.refreshLineups()

    })
  }


  _removeSkip(_id:string) {
    this.api.putAPIData$('draftpicks', _id,  {"status": "Pending"}).pipe(takeUntil(this.unsubscribe$)).subscribe((data)=> {
      console.log("Skip removed")
      this.rosterService.refreshLineups()

      })
  }

  _handleAction($event, currentDraftPick) {
    console.log($event)
    console.log(currentDraftPick)
    this.api.putAPIData$('draftpicks', currentDraftPick._id,  {"player": $event.player._id, "status": "Complete", pickTime: new Date()}).pipe(takeUntil(this.unsubscribe$)).subscribe((data)=> {
      this.rosterService.refreshLineups()
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


_addFakePlayerToTeam(defaultTeam: string = this.ownerPrimaryTeam.nickname) {

    console.log(`defaultTeam:${defaultTeam}`);

this.rosterUpdateSub = this.api.postDraftPick$({effective_date: new Date(), acqType:'draft', team: this.ownerPrimaryTeam._id})
.subscribe(
  data => console.log(data),
  err => console.log(err)
);
}


}


