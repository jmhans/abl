import { Injectable, OnDestroy } from '@angular/core';
import {BehaviorSubject, Subject, Subscription } from 'rxjs';
import {MlbPlayerModel} from '../models/mlb.player.model';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service'
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  unsubscribe$: Subject<void> = new Subject<void>();
  playerSub : Subscription;

  allPlayers$: BehaviorSubject<MlbPlayerModel[]> =new BehaviorSubject([]);

  constructor(
    http: HttpClient,
    api: ApiService) {
      this.playerSub = api.getMlbPlayers$().pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          this.allPlayers$.next(res)
        },
        err => {
          console.error(err)
        })
  }

  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
