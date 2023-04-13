import { Injectable, OnDestroy , NgZone} from '@angular/core';
import {BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';
import {MlbPlayerModel} from '../models/mlb.player.model';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service'
import { takeUntil, filter,  } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private base_api= '/api2/'
  unsubscribe$: Subject<void> = new Subject<void>();
  playerSub : Subscription;
  playerUpdates: Subscription;
  private playerData: MlbPlayerModel[];

  allPlayers$: BehaviorSubject<MlbPlayerModel[]> =new BehaviorSubject([]);
  //activePlayers$: BehaviorSubject<MlbPlayerModel[]> = new BehaviorSubject([]);


  constructor(
    private _zone: NgZone,
    http: HttpClient,
    api: ApiService) {
      this.playerSub = api.getMlbPlayers$().pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          this.playerData =res
          this.establishPlayerConnect()
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
            this.playerData[stalePlayerIndex] = updatedPlayer;
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
    this.allPlayers$.next(this.playerData);
  }

  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
