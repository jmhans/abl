import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {  MLBSchedule } from './mlbgame';
import { MessageService } from './message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

@Injectable({
  providedIn: 'root'
})
export class MlbDataService {
  private BASE_URL = "https://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
  
  constructor(private http: HttpClient,
              private messageService: MessageService) { }
  
  getGamesForDate(/*gm_date*/): Observable<any> {
    const gm_date = '2018-04-15'
    
    var inputDate = new Date(gm_date)
    var day = pad(inputDate.getDate(), 2);
    var month = pad(inputDate.getMonth() + 1, 2);
    var year = inputDate.getFullYear();
    const APIUrl = this.BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day +  "%2F" + year
    
    return this.http.get<any>(APIUrl)
      .pipe(
        map(resp => {
          return resp.dates.find(x => x.date ==  (year + "-" + month + "-" + day)).games;
        }),
        tap(_ => this.log('fetched games')), 
        catchError(this.handleError('getGamesForDate', []))
      );
  }
    private handleError<T> (operation = 'operation', result?: T) {
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
    this.messageService.add(`MLB Data Service: ${message}`);
  }
  
//   getGamesForDate(gm_date): function (gm_date) {
//             var inputDate = new Date(gm_date)
//             var day = pad(inputDate.getDate(), 2);
//             var month = pad(inputDate.getMonth() + 1, 2);
//             var year = inputDate.getFullYear();

//             return $http.get(BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day +  "%2F" + year).then(function (resp) {
//                 var dateObj = resp.data.dates.find(function (dateObj) { return (dateObj.date == (year + "-" + month + "-" + day)); });
//                 return dateObj.games;
//             })
//         }
  
  
  
}
