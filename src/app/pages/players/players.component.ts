// src/app/pages/player/players.component.ts
import { Component, OnInit, OnDestroy, ViewChild , Inject, AfterViewInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { UserContextService } from './../../core/services/user.context.service';
import { UtilsService } from './../../core/utils.service';
import { AblTeamModel } from './../../core/models/abl.team.model';
import { RosterService } from './../../core/services/roster.service';
import {  Subscription, BehaviorSubject,  throwError as ObservableThrowError, Observable , Subject, combineLatest, scheduled, asyncScheduler, of, merge} from 'rxjs';
import { switchMap, takeUntil, mergeMap, skip, mapTo, take, map , startWith, concatAll, scan } from 'rxjs/operators';
import {MatDialog as MatDialog ,MatDialogRef as MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MlbPlayerModel } from './../../core/models/mlb.player.model';
import {PlayersService } from '../../core/services/players.service';

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
export class PlayersComponent implements OnInit, OnDestroy, AfterViewInit {
  pageTitle = 'Players';
  //players$: Subject<MlbPlayerModel[]> = new Subject<MlbPlayerModel[]>();
  //playerSub: Subscription;

  ownerTeams: AblTeamModel[];
  ownerPrimaryTeam: AblTeamModel;
  ownerSub: Subscription;
  unsubscribe$: Subject<void> = new Subject<void>();

  colNames= ['name', 'mlbID', 'ablstatus.ablTeam.nickname', 'ablstatus.acqType', 'position', 'team', 'status', 'lastStatUpdate', 'abl_runs', 'stats.batting.gamesPlayed', 'stats.batting.atBats', 'stats.batting.hits', 'stats.batting.doubles',
             'stats.batting.triples', 'stats.batting.homeRuns', 'bb', 'stats.batting.hitByPitch', 'stats.batting.stolenBases', 'stats.batting.caughtStealing', 'action']

  constructor(private title: Title,
              public utils: UtilsService,
              public api: ApiService,
              public rosterService: RosterService,
              private auth: AuthService,
              public userContext: UserContextService,
              public dialog: MatDialog,
              public players: PlayersService,

              ) {


               }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
//    this.formData = this.api.getAblTeams$();


  }
ngAfterViewInit() {
  this.rosterService.refreshLineups();
  this._getOwner();

}


  _getOwner() {
    this.ownerSub = this.userContext.teams$.pipe(takeUntil(this.unsubscribe$)).subscribe(
      data => {
        this.ownerTeams = data
        this.ownerPrimaryTeam = data.length ? data[0] : '';
        if (this.ownerPrimaryTeam) {
          this.rosterService.setActiveRoster(this.ownerPrimaryTeam._id)
        }

      },
      err => console.log(err)
    )
  }


activeRoster(tmId, rosters) {
  if (rosters) {
    let userRoster = rosters.find((r)=> r.ablTeam ==tmId);
    if (userRoster) {
      return userRoster.roster.filter((p)=> p.lineupPosition !='INJ' && p.lineupPosition != 'NA')
    }
  }
 return []
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

}




