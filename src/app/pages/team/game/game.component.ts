import { Component, OnInit, Input, OnDestroy , AfterViewInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription, Observable } from 'rxjs';
import {map} from 'rxjs/operators';
import { AblGameService } from './../../../core/services/abl-game.service';
import { GameModel } from './../../../core/models/game.model';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import {MatDatepickerModule ,MatDatepickerInputEvent} from '@angular/material/datepicker';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from './../../../auth/auth.service';
import { MatTableDataSource } from '@angular/material/table'


@Component({
  selector: 'app-team-games',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class TeamGameComponent implements OnInit, AfterViewInit {
  @Input() team: AblTeamModel;

  pageTitle = 'Games';
  gamesListSub: Subscription;
  gamesList: GameModel[];
  filteredGames: GameModel[];
  loading: boolean;
  error: boolean;
  query: string = '';
  submitSub: Subscription;
  games$:Observable<MatTableDataSource<GameModel>>;

  constructor(
    private title: Title,
    public utils: UtilsService,
    private api: ApiService,
    public fs: FilterSortService,
    private datePipe: DatePipe,
    private ablGame: AblGameService,
         public auth: AuthService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this._getGamesList();

  }

  ngAfterViewInit() {
    // Establish MatTableDataSource with games content.
    this.games$ =this.api.getAblGames$().pipe(
      map(d=> {
        const ds = new MatTableDataSource(d);
        return ds;
      })
    )
  }

  private _getGamesList() {
    this.loading = true;
    // Get future, public events
    this.gamesListSub = this.api
      .getAblGames$()
      .subscribe(
        res => {
          this.gamesList = res;
          this.filteredGames = res.filter((gm)=>{ return gm.awayTeam._id == this.team._id || gm.homeTeam._id == this.team._id});
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }

  attest(gm: GameModel, result_id: string, resultIdx: number, loc: string) {
    //this.api.postData$({})
    console.log(gm);

    this.submitSub = this.ablGame.addAttestation$(gm._id,
                                              result_id,
                                              {attester: this.auth.userProfile.sub, attesterType: loc}
                                              )
        .subscribe(res => {
          console.log(`Document updated: ${res}` );
          gm.results[resultIdx] = res;
        })
  }

  _needsAttest(gm, gm_result) {

    const ownerLoc = this._findOwnerLoc(gm);
    if (ownerLoc) {
      if (gm_result) {
        const att =  gm_result.attestations.find((att)=> {return att.attesterType == ownerLoc})
        if (!att) {
          return true
        } else {
          return false
        }
      }
      return null
    }

  }

  _canAttest(gm, loc) {

    var hasAttested = false

    gm.results.forEach((gr)=> {
      if (gr.attestations.find((att)=> { return att.attesterType == loc })) {
        hasAttested = true
      }
    })

    return this.team.owners.find((owner)=>{return owner.userId == this.auth.userProfile.sub}) && !hasAttested
  }


  _findOwnerLoc(gm) {
    if (this.team._id == gm.awayTeam._id) return 'away'
    if (this.team._id == gm.homeTeam._id) return 'home'
    return null
  }

  _ownerLocs(gm) {
    var locs = []
    if (this.team._id == gm.awayTeam._id) locs.push('away')
    if (this.team._id == gm.homeTeam._id) locs.push('home')
    return locs
  }


  protest(gm) {
    console.log(gm);
    //this.api.postData$({})
  }
  getGameScore(gm_result, loc) {
    if (gm_result && gm_result.scores) {
        return gm_result.scores.find((g)=> {return g.location == loc})
    }
  }


  ngOnDestroy() {
    this.gamesListSub.unsubscribe();
    if (this.submitSub) {this.submitSub.unsubscribe()};
  }

  hasProp(o, name) {
  return o.hasOwnProperty(name);
}


}
