import {
  Injectable
} from '@angular/core';
import {
  Owner
} from './owner';
import {
  Http,
  Response
} from '@angular/http';

@Injectable()
export class OwnerService {
  private ownersUrl = '/api/owners';

  constructor(private http: Http) {}

  getOwners(): Promise < void | Owner[] > {
    return this.http.get(this.ownersUrl)
      .toPromise()
      .then(response => response.json() as Owner[])
      .catch(this.handleError);
  }

  // post("/api/owners")
  createOwner(newOwner: Owner): Promise < void | Owner > {
    return this.http.post(this.ownersUrl, newOwner)
      .toPromise()
      .then(response => response.json() as Owner)
      .catch(this.handleError);
  }

  // get("/api/owners/:id") endpoint not used by Angular app

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

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead
  }


}