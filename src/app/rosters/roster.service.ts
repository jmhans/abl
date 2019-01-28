import { Injectable } from '@angular/core';
import {  Roster } from './roster';
import {  Http,  Response } from '@angular/http';

@Injectable()
export class RosterService {
  private rostersUrl = '/api/rosters';

  constructor(private http: Http) {}

  getRosters(): Promise < void | Roster[] > {
    return this.http.get(this.rostersUrl)
      .toPromise()
      .then(response => response.json() as Roster[])
      .catch(this.handleError);
  }

  // post("/api/rosters")
  createRoster(newRoster: Roster): Promise < void | Roster > {
    return this.http.post(this.rostersUrl, newRoster)
      .toPromise()
      .then(response => response.json() as Roster)
      .catch(this.handleError);
  }

  // get("/api/rosters/:id") endpoint not used by Angular app
  
  // delete("/api/rosters/:id")
//   deleteRoster(delRosterId: String): Promise < void | String > {
//     return this.http.delete(this.rostersUrl + '/' + delRosterId)
//       .toPromise()
//       .then(response => response.json() as String)
//       .catch(this.handleError);
//   }

  // put("/api/rosters/:id")
//   updateRoster(putRoster: Roster): Promise < void | Roster > {
//     var putUrl = this.rostersUrl + '/' + putRoster._id;
//     return this.http.put(putUrl, putRoster)
//       .toPromise()
//       .then(response => response.json() as Roster)
//       .catch(this.handleError);
//   }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead
  }


}