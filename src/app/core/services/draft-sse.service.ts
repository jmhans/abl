import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError , Subject, Subscription} from "rxjs";
import { catchError, switchMap, map, tap, startWith, takeUntil, filter} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';


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
      this.draftData$.next(this.draftData);
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
