import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError , Subject, Subscription} from "rxjs";
import { catchError, switchMap, map, tap, startWith, takeUntil, filter} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';

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
  draftData$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  private draftData: any[];

  unsubscribe$: Subject<void> = new Subject<void>();

 // draftSub : Subscription;

  constructor(
    private _zone: NgZone,
    private http: HttpClient,
    private auth: AuthService
    ) {
      this.notify();
    }


    getDraftResults$() {
      this.http.get<any[]>(`${this.base_api}draftpicks`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      }).pipe(takeUntil(this.unsubscribe$)).subscribe(
        data => {
          this.draftData = data;
            this.notify()
          })
        }


    private notify() {
      let outData = []
      for (let r=1; r<=24; r++) {
        outData[r-1] = []
        for (let c=1; c<=10; c++) {
          let effRound = r<=18 ? r : 18+Math.max(0, Math.floor((r-19)/3)+1)
          let fullRoundPicks = Math.min(18, effRound -1) * 10+ Math.max(0, effRound-19)*30

          let priorPlayers = isEven(effRound) ? 10 - c: c -1
          let picksPerPlayer = (effRound <=18) ?1 :3
          let priorPlayerPicks = priorPlayers * picksPerPlayer + (r-19)% picksPerPlayer

          let pickNum = fullRoundPicks + priorPlayerPicks
          if (this.draftData && pickNum < this.draftData.length) {
            outData[r-1][c-1] = this.draftData[pickNum-1]
          } else {
            outData[r-1][c-1] = {}
          }

        }
      }

      // for (let i=0; i<this.draftData.length; i++) {
      //   let thisPickNum = i + 1
      //   let effectiveRound = Math.floor( (thisPickNum - 1) / 10) + 1
      //   let actualRound = effectiveRound
      //   let effectiveColumn = (thisPickNum-1) % 10 + 1
      //   if (isEven(effectiveRound)) {
      //     effectiveColumn = 10- (effectiveColumn -1)
      //   }
      //   if (effectiveRound >= 19) {
      //     let _effectiveRound = Math.floor( (thisPickNum -181) / 10)
      //     actualRound = 19 + Math.floor(_effectiveRound/3)*3 + (thisPickNum -1) % 3
      //     if (isEven(Math.floor(_effectiveRound/3+1))) {
      //       effectiveColumn = 10 - (Math.floor((thisPickNum - 181)/3) % 10)
      //     } else {
      //       effectiveColumn = (Math.floor((thisPickNum - 181)/3) % 10) + 1
      //     }

      //   }
      //   if (outData.length >= actualRound) {
      //     outData[actualRound -1].push(this.draftData[i])
      //   } else {
      //     outData.push([this.draftData[i]])
      //   }

      // }

      this.draftData$.next(outData);


    }

    establishConnect() {

      this.getServerSentEvent(`${this.base_api}refreshDraft`).pipe(
        takeUntil(this.unsubscribe$),
        filter((data)=> {
            const eventType = data.type
            return eventType != 'ping'
          })
          ).subscribe(
        data => {
            // let totalPicks =this.draftData.length;
            // let thisPickNum = totalPicks + 1;
            // let effectiveRound = Math.floor( (thisPickNum - 1) / 10) + 1
            // let actualRound = effectiveRound
            // let effectiveColumn = (thisPickNum-1) % 10 + 1
            // if (isEven(effectiveRound)) {
            //   effectiveColumn = 10- (effectiveColumn -1)
            // }
            // if (effectiveRound >= 19) {
            //   let _effectiveRound = Math.floor( (thisPickNum -181) / 10)
            //   actualRound = 19 + Math.floor(_effectiveRound/3)*3 + (thisPickNum -1) % 3
            //   if (isEven(Math.floor(_effectiveRound/3+1))) {
            //     effectiveColumn = 10 - (Math.floor((thisPickNum - 181)/3) % 10)
            //   } else {
            //     effectiveColumn = (Math.floor((thisPickNum - 181)/3) % 10) + 1
            //   }

            // }

            // let pick = JSON.parse(data.data).pick;
            // pick.column = effectiveColumn
            // pick.row = actualRound

            this.draftData = [...this.draftData, JSON.parse(data.data).pick];
            this.notify()
          console.log(this.draftData)
        }
      )}



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
