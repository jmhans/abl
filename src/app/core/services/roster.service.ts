import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { RosterRecordModel, CreateRosterRecordModel } from './../models/roster.record.model';
import { LineupModel, LineupAddPlayerModel, SubmitLineup, LineupCollectionModel } from './../models/lineup.model';
import { MlbPlayerModel } from './../models/mlb.player.model';
import { AuthService } from './../../auth/auth.service';
import { throwError as ObservableThrowError, Observable, BehaviorSubject, Subject } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})



export class RosterService {
  private base_api= '/api2/'
  currentLineup$: Observable<LineupModel>;
  retrieveLineup$ = new Subject<{ablTm: string, dt: Date}>();
  activeRosters$: BehaviorSubject<LineupModel[]>= new BehaviorSubject([]);
  private _viewDate: Date = new Date()

  constructor(
    private http: HttpClient,
    private auth: AuthService) {

        this.currentLineup$ = this.retrieveLineup$.pipe(
          switchMap((obj) => this.getLineupForTeamAndDate$(obj.ablTm, obj.dt)
        ));

        this.getAllLineups$().subscribe(
          data => {
            this.activeRosters$.next(data)
          }
        )



    }


  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }


  // POST new roster record (authorized only)

  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }


  getLineupByTeamId$(teamId: string): Observable<LineupModel> {
    return this.http
      .get<LineupModel>(`${this.base_api}team/${teamId}/lineup`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  getLineupForTeamAndDate$(teamId: string, gmDt: Date): Observable<LineupModel> {
    return this.http
      .get<LineupModel>(`${this.base_api}lineups/${teamId}/date/${gmDt.toISOString()}`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  getAllLineups$(): Observable<LineupModel[]> {
    return this.http
      .get<LineupModel[]>(`${this.base_api}lineups`, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }


  addPlayertoTeam$(addPlayer: Object, ablTeamId: string ): Observable<LineupModel> {
    return this.http
      .post<LineupModel>(`${this.base_api}team/${ablTeamId}/addPlayer`, addPlayer, {
        headers: new HttpHeaders().set('Authorization', this._authHeader)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }


  createRosterRecord$(ablTeam: string, lineup: SubmitLineup): Observable<LineupCollectionModel> {
    var submitlineup = {
      ablTeam: ablTeam,
      roster: lineup.roster,
      effectiveDate: new Date()
    }
    return this.http
        .post<LineupModel>(`${this.base_api}lineups`, submitlineup, {
          headers: new HttpHeaders().set('Authorization', this._authHeader)
        })
        .pipe(
          catchError((error) => this._handleError(error))
        );
  }
  updateRosterRecord$(ablTeamId: string, lineup: SubmitLineup): Observable<LineupModel> {

    return this.http
        .put<LineupModel>(`${this.base_api}lineups/${ablTeamId}/date/${lineup.effectiveDate.toISOString()}`, lineup, {
          headers: new HttpHeaders().set('Authorization', this._authHeader)
        })
        .pipe(
          catchError((error) => this._handleError(error))
        );
  }

  dropPlayerFromTeam$(ablTeamId: string, plyr: string): Observable<any> {

    return this.http
        .get<any>(`${this.base_api}lineups/${ablTeamId}/drop/${plyr}`, {
          headers: new HttpHeaders().set('Authorization', this._authHeader)
        })
        .pipe(
          catchError((error) => this._handleError(error))
        );
  }



  updateRoster(ablTeamId: string, lineup: SubmitLineup): Observable<any> {
    // First, run the update routine.
    // When update returns, switchMap to the normal roster retrieve function.

    return this.updateRosterRecord$(ablTeamId, lineup).pipe(map((ret)=> {
      this.retrieveLineup$.next({ablTm: ret.ablTeam["_id"], dt: new Date(ret.effectiveDate)});
      return ret
    }))

  }




}
