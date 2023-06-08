import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError , Subject, Subscription, combineLatestWith} from "rxjs";
import { catchError, switchMap, map, tap, startWith, takeUntil, filter, combineLatest} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../api.service';
import { RosterService } from './roster.service';

function isEven(n) {
  return n % 2 == 0;
}

function isOdd(n) {
  return Math.abs(n % 2) == 1;
}


@Injectable({
  providedIn: 'root'
})
export class DraftSseService {
  private base_api= '/api2/'
  draftResults$: Observable<any[]>;
  draftData$: BehaviorSubject<any> = new BehaviorSubject([]);
  playerData$: BehaviorSubject<any> = new BehaviorSubject([]);
  draftOrder=[{"_id":"6237c905f0008a002ecab341","nickname":"Heifers","pickOrder":"1"},{"_id":"5cb0a473b3a0230033312621","nickname":"Sferics","pickOrder":"2"},{"_id":"5cb0a443b3a023003331261d","nickname":"Cracks","pickOrder":"3"},{"_id":"6057711a0049fc1c60942e9d","nickname":"Iguanas","pickOrder":"4"},{"_id":"5cb0a3a4b3a0230033312614","nickname":"Campers","pickOrder":"5"},{"_id":"5cb0a403b3a0230033312618","nickname":"Vipers","pickOrder":"6"},{"_id":"5cb0a490b3a0230033312623","nickname":"Rats","pickOrder":"7"},{"_id":"5ca28dbed79ef30033562385","nickname":"Machines","pickOrder":"8"},{"_id":"5cb0a459b3a023003331261f","nickname":"Psychos","pickOrder":"9"},{"_id":"5cb0a41fb3a023003331261a","nickname":"Winers","pickOrder":"10"}]
  draftOrder$: BehaviorSubject<any> = new BehaviorSubject([]);

  private draftData: any[];

  unsubscribe$: Subject<void> = new Subject<void>();

 // draftSub : Subscription;

  constructor(
    private _zone: NgZone,
    private http: HttpClient,
    private auth: AuthService,
    private api:ApiService,
    private rosterService: RosterService,

    ) {
      //this.notify();
      this.api.getAPIData$('standings').pipe(
          takeUntil(this.unsubscribe$),
          map(data => {
            return data.sort((a,b)=> {
              let wpct = (o)=> {return o.w/o.g}
              if (wpct(a) == wpct(b)) {
                return a.avg_runs - b.avg_runs
              }

              return (a.w / a.g) - (b.w / b.g)})
          }),
          combineLatestWith(rosterService.activeRosters$),
          map(([standings, rosters])=> { return standings.map(s=> {
            s.roster =rosters.find((r)=> r.ablTeam == s.tm._id)
            return s
          })}),
          map((data) => {
            return data.map((team)=> {
              let supp_draft_picks = team.roster?.roster.filter((p)=> p.player.ablstatus.acqType == 'supp_draft');
              return {...team, supp_draft_picks: supp_draft_picks}

            })
          }),
          map((data)=> {
            return {currentPick: {row: 1, column: 4}, rosters: data}
          })
        ).subscribe(data => {
        this.draftOrder$.next(data)
      })


    }


    // getDraftResults$() {
    //   this.http.get<any[]>(`${this.base_api}draftpicks`, {
    //     headers: new HttpHeaders().set('Authorization', this._authHeader)
    //   }).pipe(takeUntil(this.unsubscribe$)).subscribe(
    //     data => {
    //       this.draftData = data;
    //       this.establishConnect()
    //       this.notify()
    //       })
    //     }


    private notify() {
      let outData = []
      let nextRow =0
      let nextCol = 0
      for (let r=1; r<=24; r++) {
        outData[r-1] = []
        for (let c=1; c<=10; c++) {
          let effRound = r<=18 ? r : 18+Math.max(0, Math.floor((r-19)/3)+1)
          let fullRoundPicks = Math.min(18, effRound -1) * 10+ Math.max(0, effRound-19)*30

          let priorPlayers = isEven(effRound) ? 10 - c: c -1
          let picksPerPlayer = (effRound <=18) ?1 :3
          let priorPlayerPicks = priorPlayers * picksPerPlayer + (r-19)% picksPerPlayer

          let pickNum = fullRoundPicks + priorPlayerPicks + 1
          if (this.draftData && pickNum <= this.draftData.length) {
            outData[r-1][c-1] = this.draftData[pickNum-1]
          } else {
            outData[r-1][c-1] = {}
            if (pickNum == this.draftData?.length + 1) {
              nextRow = r -1
              nextCol = c-1
            }
          }

        }
      }

      this.draftData$.next({order: this.draftOrder, currentPick: {number: this.draftData?.length + 1, row: nextRow , column: nextCol}, picks: outData});


    }




    // establishConnect() {
    //   this.getServerSentEvent(`${this.base_api}refreshDraft`).pipe(
    //       takeUntil(this.unsubscribe$),
    //       filter((data)=> {
    //           const eventType = data.type
    //           return eventType != 'ping'
    //         })
    //         ).subscribe(
    //       data => {
    //           this.draftData = [...this.draftData, JSON.parse(data.data).pick];
    //           this.notify()
    //         console.log(this.draftData)
    //       }
    //     )
    // }








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

  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }

  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }



  private getEventSource(url: string): EventSource {
    return new EventSource(url);
  }
  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
