import { Injectable } from '@angular/core';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';


@Injectable({
  providedIn: 'root'
})
export class MlbService {


    gameDateReplSub$ = new ReplaySubject<string>(1);
    gameData$ : Observable<any[]> = this.gameDateReplSub$.pipe(
      switchMap((gameDate: string)=> {
        let lkpDate = gameDate.replaceAll('-', '%2F')
        return this.api.getMlbGames$(lkpDate);
    })
    );

    constructor(private api: ApiService) {
      //dt should be of string format in MM/dd/YYYY format.

      let currDate = (new Date()).toLocaleDateString("en-US", {month: '2-digit', day:'2-digit', timeZone: 'America/Chicago', year: 'numeric'})
      this.gameDateReplSub$.next(currDate)
    }

    setDate(dt: string): void {
      this.gameDateReplSub$.next(dt)
    }


}

