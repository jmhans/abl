import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError , Subject, Subscription} from "rxjs";
import { catchError, map, takeUntil} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';


@Injectable({
  providedIn: 'root'
})
export class DraftSseService {
  private base_api= '/api2/'
  draftResults$ = this.getServerSentEvent(`${this.base_api}refreshDraft`)
  draftData$: BehaviorSubject<any[]> = new BehaviorSubject([]);

  unsubscribe$: Subject<void> = new Subject<void>();
  draftSub : Subscription;

  constructor(
    private _zone: NgZone,
    private http: HttpClient,
    private auth: AuthService
    ) {
      this.draftSub = this.http
      .get<any[]>(`${this.base_api}draftpicks`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      ).pipe(takeUntil(this.unsubscribe$)).subscribe(
        res=> {
          this.draftData$.next(res)
        },
        err => {
          console.error(err)
        })
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

  draft$(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.base_api}draftpicks`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
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
