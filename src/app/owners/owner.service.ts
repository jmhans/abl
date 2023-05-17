import { Injectable } from '@angular/core';
import { Owner } from './owner';
import { Team } from './owner';

import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { Observable, of, throwError as ObservableThrowError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MessageService } from '../core/services/message.service';
import { AuthService } from './../auth/auth.service';

//maybe need ENV from config file.


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private ownersUrl = '/api/owners';
  private owners2Url = '/api2/owners';
  private teamsUrl = '/api/teams';

  constructor(
//               private http: Http,
               private httpC: HttpClient,
               private messageService: MessageService,
               private auth: AuthService
               ) {}

  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }

   getOwners2 (): Observable<Owner[]> {
    return this.httpC.get<Owner[]>(`${this.ownersUrl}`, {
      headers: new HttpHeaders().set('Authorization', this._authHeader  )
    })
      .pipe(

        catchError(this.handleError2('getOwners2', []))
      );
  }

  /** POST: add a new Owner to the server */
  addOwner (owner: Owner): Observable<Owner> {
    return this.httpC.post<Owner>(this.ownersUrl, owner, httpOptions).pipe(

      catchError(this.handleError2<Owner>('addOwner'))
    );
  }
  // get("/api/owners/:id") endpoint not used by Angular app
  addTeam (team: Team): Observable<Team> {
    return this.httpC.post<Team>(this.teamsUrl, team, httpOptions).pipe(

      catchError(this.handleError2<Team>('addTeam'))
    );
  }


  /** GET hero by id. Will 404 if id not found */
  getOwner(id: String): Observable<Owner> {
    const url = `${this.ownersUrl}/${id}`;
    return this.httpC.get<Owner>(url).pipe(

      catchError(this.handleError2<Owner>(`getOwner id=${id}`))
    );
  }


  /** DELETE: delete the hero from the server */
  deleteOwner2 (owner: Owner | string): Observable<Owner> {
    const id = typeof owner === 'string' ? owner : owner._id;
    const url = `${this.ownersUrl}/${id}`;

    return this.httpC.delete<Owner>(url, httpOptions).pipe(

      catchError(this.handleError2<Owner>('deleteOwner'))
    );
  }


    /** PUT: update the hero on the server */
  updateOwner2 (owner: Owner): Observable<any> {
    var putUrl = this.ownersUrl + '/' + owner._id;
    return this.httpC.put(putUrl, owner, httpOptions).pipe(

      catchError(this.handleError2<any>('updateOwner2'))
    );
  }

  /* GET owners whose name contains search term */
  searchOwners(term: string): Observable<Owner[]> {
    if (!term.trim()) {
      // if not search term, return empty hero array.
      return of([]);
    }

    // Implement this method (e.g. "name" as part of the url string) on the API.
        return this.httpC.get<Owner[]>(`${this.ownersUrl}/?name=${term}`).pipe(

      catchError(this.handleError2<Owner[]>('searchOwners', []))
    );
  }



  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead
  }

  private handleError2<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

       const errorMsg = error.message || 'Error: Unable to complete request.';
        if (error.message && error.message.indexOf('No JWT present') > -1) {
          this.auth.login();

        }

      // TODO: better job of transforming error for user consumption


      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private handleError3(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();

    }
    return ObservableThrowError(errorMsg);
  }


}
