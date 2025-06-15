import { Injectable } from '@angular/core';
import {  AuthService} from './../../auth/auth.service';
import {  ApiService} from './../api.service';
import {  Subscription, BehaviorSubject,  Subject, combineLatest, throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError , takeUntil} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  teams: any[] = []
  loggedInSub: Subscription;
  teamsSubscription: Subscription;
  teams$ = new BehaviorSubject<any[]>(this.teams);
  actingTeam$ = new BehaviorSubject<any>(undefined)
  owners$ = new Subject<any[]>();
  owner$ = new Subject<any>();
  unsubscribe$: Subject<void> = new Subject<void>();
  private owners:any[] = [];


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
    this.getOwners();
    this.getCurrentOwner();
  }

  async getOwners() {
    this.api.getAPIData$('users').pipe(takeUntil(this.unsubscribe$)).subscribe(
      res=> {
        this.owners = res
        this.owners$.next(this.owners)
      },
      err => {
        console.error(err)
      })
  }

 async getCurrentOwner() {

    combineLatest([this.owners$, this.auth.user$]).pipe(takeUntil(this.unsubscribe$)).subscribe(
      ([ownerList, currUser]) => {
        let currOwner =ownerList.find((owner)=> {return owner.userId == currUser.sub})
        if (currOwner) {
          this.owner$.next(currOwner)
        }
    })
  }

  async getTeams() {
    this.teams$.next([]);
    const qry = {
      "$in": this.auth.userProfile['http://ff_teams.com/teams/ff_teams']
    };

    this.teamsSubscription = this.api.getAblTeams$()
      .subscribe(
        res => {
          var owner_teams = res.filter((tm)=> {
            var matchO = tm.owners.find((o)=> {return o.userId == this.auth.userProfile.sub})
            return matchO
          })
          this.teams = owner_teams;
          this.teams$.next(owner_teams);
          if (owner_teams.length > 0) {
            this.actingTeam$.next(owner_teams[0])
          }

        },
        err => {
          console.error(err);
        }
      );

  }

  async setActingTm(tmID) {
    var act_team = this.teams.find((tm)=> {return tm._id == tmID})
    if (act_team) {
      this.actingTeam$.next(act_team)
    }
  }

  getDisplayName(userId: string) {
    let owner = this.owners.find((owner)=> {return owner.userId == userId})
    if (owner) {
      return owner.name
    }
    return ''
  }


}


