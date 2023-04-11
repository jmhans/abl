import { Component, OnInit, Input, OnDestroy , AfterViewInit,ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription, Observable } from 'rxjs';
import {map} from 'rxjs/operators';
import { AblGameService } from './../../../core/services/abl-game.service';
import { GameModel } from './../../../core/models/game.model';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { AuthService } from './../../../auth/auth.service';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table'
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';



@Component({
  selector: 'app-team-games',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class TeamGameComponent implements OnInit, AfterViewInit, OnDestroy {
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
  currentWeek: number = 0
  dataLength: number;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private title: Title,
    public utils: UtilsService,
    private api: ApiService,
    public fs: FilterSortService,
    private ablGame: AblGameService,
         public auth: AuthService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
   // this._getGamesList();

  }

  ngAfterViewInit() {
    // Establish MatTableDataSource with games content.
    this.games$ =this.api.getAblGames$().pipe(
      map(d=> {
        let data = d.filter((gm)=>{ return gm.awayTeam._id == this.team._id || gm.homeTeam._id == this.team._id});

        data.sort((a,b)=> {
          let ad =new Date(a.gameDate)
          let bd = new Date(b.gameDate)

          return (ad < bd) ? -1 : ((ad == bd) ? 0 : 1) })

        let nextGameIdx = data.findIndex(gm=> {return new Date(gm.gameDate) > new Date()})

 //       this.currentWeek = Math.floor(  nextGameIdx /5)
        this.paginator.pageIndex = Math.floor( nextGameIdx / 5)
        this.dataLength = data.length
        const ds = new MatTableDataSource(data);
        ds.paginator = this.paginator;

        return ds;
      })
    )
  }


  attest(gm: GameModel, result_id: string, resultIdx: number, loc: string) {
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

  _needsAttest(gm: GameModel, gm_result) {

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
  }
  getGameScore(gm_result, loc) {
    if (gm_result && gm_result.scores) {
        return gm_result.scores.find((g)=> {return g.location == loc})
    }
  }


  ngOnDestroy() {

    if (this.submitSub) {this.submitSub.unsubscribe()};
  }

  hasProp(o, name) {
  return o.hasOwnProperty(name);
}


}
