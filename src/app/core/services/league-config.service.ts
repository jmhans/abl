import { Injectable } from '@angular/core';
import {  BehaviorSubject , Observable, Subscription, Subject , AsyncSubject} from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './../api.service';


interface leagueConfig {
  rosterLockTime?: string;
  rosterLockHour?: number;
  rosterLockTimeZone?: string;
}


@Injectable({
  providedIn: 'root'
})


export class LeagueConfigService {

  leagueSub: Subscription;
  league$ = new AsyncSubject<leagueConfig>();


  constructor(private api: ApiService) {

    this.leagueSub = this.api.getleagueConfig$().subscribe(
      res => {
        if (res) {
          this.league$.next(res);
          this.league$.complete();
        }
      }
    )


  }
}
