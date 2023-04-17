import { Injectable } from '@angular/core';
import {  Roster } from './roster';
import {  HttpClient,  HttpErrorResponse , HttpHeaders} from '@angular/common/http';

import { AuthService } from './../auth/auth.service';
import { MessageService } from '../core/services/message.service';
import { Observable, of, throwError as ObservableThrowError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class RosterService {
  private rostersUrl = '/api/rosters';

  constructor(private http: HttpClient,
              private messageService: MessageService,
              private auth: AuthService) {}

  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }


  getRosters(): Observable < Roster[] > {
    return this.http.get<Roster[]>(`${this.rostersUrl}`, {
      headers: new HttpHeaders().set('Authorization', this._authHeader  )
    })
      .pipe(
        tap(_ => this.log('fetched rosters')),
        catchError(this.handleError('getRosters', []))
    );
  }

  // post("/api/rosters")
  createRoster(newRoster: Roster): Observable < Roster > {
    return this.http.post<Roster>(this.rostersUrl, newRoster, httpOptions).pipe(
      tap((roster: Roster)=> this.log(`added owner w/ id=${roster._id}`)),
      catchError(this.handleError<Roster>('createRoster'))
    );
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

       const errorMsg = error.message || 'Error: Unable to complete request.';
        if (error.message && error.message.indexOf('No JWT present') > -1) {
          this.auth.login();

        }

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

    /** Log a HeroService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`RosterService: ${message}`);
  }


}
