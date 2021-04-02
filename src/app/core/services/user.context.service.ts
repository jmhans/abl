import { Injectable } from '@angular/core';
import {  AuthService} from './../../auth/auth.service';
import {  ApiService} from './../api.service';
import {  Subscription, BehaviorSubject,  throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  teams: any[] = []
  loggedInSub: Subscription;
  teamsSubscription: Subscription;
  teams$ = new BehaviorSubject<any[]>(this.teams);

  constructor(
    private auth: AuthService,
    private api: ApiService
  ) {
    this.loggedInSub = this.auth.loggedIn$.subscribe(
      loggedIn => {
        if (loggedIn) {
          this.getTeams();
        } else {
          this.teams$.next([]);
        }
      }
    );
  }

     

  async getTeams() {
    this.teams$.next([]);
    const qry = {
      "$in": this.auth.userProfile['http://ff_teams.com/teams/ff_teams']
    };
    
    this.teamsSubscription = this.api.getAblTeams$()
      .subscribe(
        res => {
          this.teams$.next(res.filter((tm)=> {
            var matchO = tm.owners.find((o)=> {return o.userId == this.auth.userProfile.sub})
            return matchO
          }))
        },
        err => {
          console.error(err);
        }
      );

  }

}


