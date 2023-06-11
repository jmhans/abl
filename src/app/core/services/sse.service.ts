import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError , Subject, Subscription, combineLatestWith} from "rxjs";
import { catchError, switchMap, map, tap, startWith, takeUntil, filter, combineLatest} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../api.service';

import { ObserversModule } from "@angular/cdk/observers";
function isEven(n) {
  return n % 2 == 0;
}

function isOdd(n) {
  return Math.abs(n % 2) == 1;
}

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private base_api= '/api2/'
  private eventSource: EventSource =new EventSource(`${this.base_api}sse`)
  unsubscribe$: Subject<void> = new Subject<void>();

  constructor(    private _zone: NgZone,
    private http: HttpClient,
    private auth: AuthService,
    private api:ApiService,
    ) { }


    getSSE$(eventType: string) {
      return new Observable(observer=> {
        this.eventSource.addEventListener(eventType, event=> {
          this._zone.run(()=> {
            observer.next(event)
          })
        })
        this.eventSource.onerror = error => {
          this._zone.run(() => {
            observer.error(error);
          });
        };
      })
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

    ngOnDestroy() {

      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

}
