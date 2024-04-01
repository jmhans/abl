import { Injectable, OnDestroy , NgZone} from '@angular/core';
import {BehaviorSubject, Subject, ReplaySubject, Subscription, Observable, combineLatest } from 'rxjs';
import {MlbPlayerModel} from '../models/mlb.player.model';
import {MlbRoster} from '../models/mlb.roster';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service'
import { takeUntil, filter,  startWith, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private base_api= '/api2/'
  unsubscribe$: Subject<void> = new Subject<void>();
  playerSub : Subscription;
  playerSub2 : Subscription;

  positionsSub : Subscription;

  playerUpdates: Subscription;
  private playerData: MlbPlayerModel[];
  private tempPlayerData: MlbPlayerModel[];
  private rosterData: MlbRoster[];
  loadType: string = 'active';
  positionsData$ = new BehaviorSubject<MlbPlayerModel[]>([]);
  allEnrichedPlayers$ = new ReplaySubject<MlbPlayerModel[]>(1); // = new Subject();

  allPlayers$ = new ReplaySubject<MlbPlayerModel[]>(1); // = new Subject();
  //activePlayers$: BehaviorSubject<MlbPlayerModel[]> = new BehaviorSubject([]);

  mlbRosters$: BehaviorSubject<MlbRoster[]> = new BehaviorSubject([]); // Roster data is source of truth for player status/team/etc.

  constructor(
    private _zone: NgZone,
    http: HttpClient,
    api: ApiService) {

      this.positionsSub = api.getAblPlayerPositions$().pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.positionsData$.next(res)
      });

      this.playerSub2 = combineLatest([api.getMlbPlayerNames$(), this.positionsData$]).pipe(
        takeUntil(this.unsubscribe$),
        map(([plyrNames, plyrPositions]) => {
          let enrichedPlayers = plyrNames.map((p)=> {
            p.eligible =plyrPositions.find((posRec)=> posRec.mlbID == p.mlbID)?.eligible
            return p
          })
          return enrichedPlayers
        })
      ).subscribe(
        res=> {
          this.playerData = res
          this.establishPlayerConnect()

          this.playerNotify();
        },
        err => {
          console.error(err)
        })


/*       this.playerSub = api.getMlbPlayers$().pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          //this.playerData =res
          //this.establishPlayerConnect()

          //this.playerNotify()


        },
        err => {
          console.error(err)
        }) */

      api.getMlbRosters$().pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          this.rosterData = res
          this.playerNotify()
        },
        err => {
          console.error(err)
        })


  }

  establishPlayerConnect() {
    this.getServerSentEvent(`${this.base_api}playerUpdates`).pipe(
        takeUntil(this.unsubscribe$),
        filter((data)=> {
            const eventType = data.type
            return eventType != 'ping'
          })
          ).subscribe(
        data => {
            let updatedPlayer = JSON.parse(data.data).player;

            let stalePlayerIndex = this.playerData.findIndex((p)=> {return p._id == updatedPlayer._id});
            this.playerData[stalePlayerIndex].ablstatus = updatedPlayer.ablstatus;
            //console.log(this.playerData.find(p=> {return p._id == updatedPlayer._id}))
            this.playerNotify()
        }
      )
    }

    getServerSentEvent(url: string): Observable<any> {
      return new Observable(observer => {
        const eventSource = this.getEventSource(url);
        eventSource.onmessage = event => {
          this._zone.run(() => {
            observer.next(event);
          });
        };
        eventSource.onerror = error => {
          this._zone.run(() => {
            observer.error(error);
          });
        };
      });
    }

    private getEventSource(url: string): EventSource {
      return new EventSource(url);
    }


  private playerNotify() {
    //if (this.playerData) {this.allPlayers$.next(this.playerData)}
    if (this.rosterData) {this.mlbRosters$.next(this.rosterData)}
    if (this.playerData) {this.allEnrichedPlayers$.next(this.playerData)}

  }

  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
