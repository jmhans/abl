import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { RosterRecordModel, CreateRosterRecordModel } from './../models/roster.record.model';
import { LineupModel, LineupAddPlayerModel, SubmitLineup, LineupCollectionModel } from './../models/lineup.model';
import { DraftPickModel } from './../models/draft.model';
import { MlbPlayerModel } from './../models/mlb.player.model';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../../core/api.service';
import { throwError as ObservableThrowError, Observable, BehaviorSubject, Subject, merge, ReplaySubject, combineLatest, of } from 'rxjs';
import { catchError, switchMap, map, tap, scan, combineLatestAll, shareReplay,combineLatestWith } from 'rxjs/operators';
import { SseService } from './sse.service';

function Identity<T>(value: T): T {
  return value;
}

function reload(selector: Function = Identity) {
  return scan((oldValue, currentValue) => {
    if(!oldValue && !currentValue)
      throw new Error(`Reload can't run before initial load`);

    return selector(currentValue || oldValue);
  });
}

function combineReload<T>(
  value$: Observable<T>,
  reload$: Observable<void>,
  selector: Function = Identity
): Observable<T> {
  return merge(value$, reload$).pipe(
    reload(selector),
    map((value: any) => value as T)
  );
}


@Injectable({
  providedIn: 'root'
})



export class RosterService {

  private base_api= '/api2/'
  //currentLineup$: Observable<LineupModel>;
  //retrieveLineup$ = new Subject<{ablTm: string, dt: Date}>();
  refresh$: Subject<void> = new Subject();
  //activeRosters$: BehaviorSubject<LineupModel[]>= new BehaviorSubject([]);
  activeRosters$:Observable<LineupModel[]>;
  draftList$:Observable<DraftPickModel[]>;
  skipList$:BehaviorSubject<any> = new BehaviorSubject([]);



  activeRosterIdReplaySubj$: ReplaySubject<string> = new ReplaySubject(1);
  rosterReloadSubj$ = new Subject<void>();
  allRostersObs$: Observable<LineupModel[]> = this.api.getAllLineups$()
  .pipe(
    shareReplay(1)
  )
  activeRoster$: Observable<LineupModel> = this.activeRosterIdReplaySubj$
  .pipe(
    combineLatestWith(this.allRostersObs$),
    map(([id, rstrs])=> {
      var team_roster = rstrs.find((roster)=> roster.ablTeam == id)
      let lm = new LineupModel(team_roster._id, team_roster.ablTeam, team_roster.roster, team_roster.effectiveDate, team_roster.gameDate)
        return lm // rstrs.find((roster)=> roster.ablTeam == id)
    })
  )

    private cachedRosters:LineupModel[];


  private _viewDate: Date = new Date()


  constructor(
    private http: HttpClient,
    //private SseService: SseService,
    private api:ApiService
) {

/*         this.currentLineup$ = this.retrieveLineup$.pipe(
          switchMap((obj) => this.api.getLineupForTeamAndDate$(obj.ablTm, obj.dt)
        )); */
//        this.refreshSkips();




this.activeRosters$ = this.refresh$.pipe(
  tap(()=> {
    //this.refreshSkips();
  }),
  switchMap(()=> this.api.getAllLineups$())
  );

this.draftList$ = this.refresh$.pipe(switchMap(()=> this.api.getDraftPicks$('supp_draft')))

this.refreshLineups();
this.refreshSkips();

    }


  refreshLineups() {
    this.refresh$.next();
  }


  refreshSkips() {

    this.api.getSkips$().subscribe((data)=>{
        this.skipList$.next(data)
      });

  }


  addPlayertoTeam$(addPlayer: Object, ablTeamId: string ): Observable<LineupModel> {
    return this.api.addPlayertoTeam$(addPlayer, ablTeamId)
      .pipe(
        //tap(()=> this.getRosters())
      );
  }





  createRosterRecord$(ablTeam: string, lineup: SubmitLineup): Observable<LineupCollectionModel> {
    var submitlineup = {
      ablTeam: ablTeam,
      roster: lineup.roster,
      effectiveDate: new Date()
    }
    return this.api.postLineup$( submitlineup)
        .pipe(
          //tap(()=> this.getRosters())

        );
  }
  updateRosterRecord$(ablTeamId: string, lineup: SubmitLineup): Observable<LineupModel> {

    return this.api.putLineup$(ablTeamId, lineup)
        .pipe(
          tap(()=> this.refreshLineups())

        );
  }

  dropPlayerFromTeam$(ablTeamId: string, plyr: string): Observable<any> {

    return this.api.dropPlayerFromTeam$(ablTeamId, plyr)
        .pipe(
          tap(()=> this.refreshLineups())

        );
  }



  updateRoster(ablTeamId: string, lineup: SubmitLineup): Observable<any> {
    // First, run the update routine.
    // When update returns, switchMap to the normal roster retrieve function.

    return this.updateRosterRecord$(ablTeamId, lineup).pipe(map((ret)=> {
      //this.retrieveLineup$.next({ablTm: ret.ablTeam["_id"], dt: new Date(ret.effectiveDate)});
      return ret
    }))

  }

  setActiveRoster(rosterId: string): void {
    this.activeRosterIdReplaySubj$.next(rosterId)
    console.log(`Nexted the RosterId!: ${rosterId}`)
  }


}
