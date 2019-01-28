import { Injectable } from '@angular/core';
import { Owner } from './owner';
import { Http,Response } from '@angular/http';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MessageService } from '../message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private ownersUrl = '/api/owners';

  constructor(
               private http: Http,  
               private httpC: HttpClient,
               private messageService: MessageService
               ) {}

  getOwners(): Promise < void | Owner[] > {
    return this.http.get(this.ownersUrl)
      .toPromise()
      .then(response => response.json() as Owner[])
      .catch(this.handleError);
  }

   getOwners2 (): Observable<Owner[]> {
    return this.httpC.get<Owner[]>(`${this.ownersUrl}`)
      .pipe(
        tap(_ => this.log('fetched owners')),
        catchError(this.handleError2('getOwners2', []))
      );
  }
  // post("/api/owners")
  createOwner(newOwner: Owner): Promise < void | Owner > {
    return this.http.post(this.ownersUrl, newOwner)
      .toPromise()
      .then(response => response.json() as Owner)
      .catch(this.handleError);
  }

  // get("/api/owners/:id") endpoint not used by Angular app
  
  /** GET hero by id. Will 404 if id not found */
  getOwner(id: String): Observable<Owner> {
    const url = `${this.ownersUrl}/${id}`;
    return this.httpC.get<Owner>(url).pipe(
      tap(_ => this.log(`fetched owner id=${id}`)),
      catchError(this.handleError2<Owner>(`getOwner id=${id}`))
    );
  }

  // delete("/api/owners/:id")
  deleteOwner(delOwnerId: String): Promise < void | String > {
    return this.http.delete(this.ownersUrl + '/' + delOwnerId)
      .toPromise()
      .then(response => response.json() as String)
      .catch(this.handleError);
  }

  // put("/api/owners/:id")
  updateOwner(putOwner: Owner): Promise < void | Owner > {
    var putUrl = this.ownersUrl + '/' + putOwner._id;
    return this.http.put(putUrl, putOwner)
      .toPromise()
      .then(response => response.json() as Owner)
      .catch(this.handleError);
  }
  
    /** PUT: update the hero on the server */
  updateOwner2 (owner: Owner): Observable<any> {
    var putUrl = this.ownersUrl + '/' + owner._id;
    return this.httpC.put(putUrl, owner, httpOptions).pipe(
      tap(_ => this.log(`updated owner id=${owner._id}`)),
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
      tap(_ => this.log(`found owners matching "${term}"`)),
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

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
  
  
  /** Log a HeroService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`HeroService: ${message}`);
  }

}