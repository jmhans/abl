import { Injectable } from '@angular/core';
import { Player } from './player';
import { Http, Response } from '@angular/http';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private playersUrl = '/api/players'; 
  constructor(private http: Http) { }
  
  getPlayers(): Promise<void |Player[] > {
    return this.http.get(this.playersUrl)
    .toPromise()
    .then(response => response.json() as Player[])
    .catch(this.handleError);
  }
  
  // post("/api/players")
    createPlayer(newPlayer: Player): Promise<void | Player> {
      return this.http.post(this.playersUrl, newPlayer)
                 .toPromise()
                 .then(response => response.json() as Player)
                 .catch(this.handleError);
    }

    // get("/api/Players/:id") endpoint not used by Angular app

    // delete("/api/players/:id")
    deletePlayer(delPlayerId: String): Promise<void | String> {
      return this.http.delete(this.playersUrl + '/' + delPlayerId)
                 .toPromise()
                 .then(response => response.json() as String)
                 .catch(this.handleError);
    }

    // put("/api/players/:id")
    updatePlayer(putPlayer: Player): Promise<void | Player> {
      var putUrl = this.playersUrl + '/' + putPlayer._id;
      return this.http.put(putUrl, putPlayer)
                 .toPromise()
                 .then(response => response.json() as Player)
                 .catch(this.handleError);
    }

    private handleError (error: any) {
      let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      console.error(errMsg); // log to console instead
    }
  
  
}
