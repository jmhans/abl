import { Component, OnInit, Input, OnDestroy , AfterViewInit,ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription, Observable, of , Subject, BehaviorSubject} from 'rxjs';
import {map, tap, combineLatestWith} from 'rxjs/operators';
import { AblGameService } from './../../../core/services/abl-game.service';
import { GameModel, CalendaredGameModel, GameClass } from './../../../core/models/game.model';
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
export class TeamGameComponent implements OnInit, OnDestroy {
  @Input() team: AblTeamModel;

  pageTitle = 'Games';
  gamesListSub: Subscription;
  gamesList: GameModel[];
  filteredGames: GameModel[];
  loading: boolean;
  error: boolean;
  query: string = '';
  submitSub: Subscription;
  calendaredGames$:Observable<CalendaredGameModel[]>;
  displayedGames$:Observable<CalendaredGameModel[]>;
  paginator$:BehaviorSubject<any>;
  dates:Date[];
  dataLength: number;

  initialPgIdx: number;

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
    this.paginator$ = new BehaviorSubject({'pageIndex': 0, 'pageSize': 6})

   // this._getGamesList();


   this.calendaredGames$ = this.api.getAblGames$().pipe(
     tap( (d)=> console.log("I've got some cal games!")),
     map((d:GameClass[])=> {
       let data = d.filter((gm)=>{ return gm.awayTeam._id == this.team._id || gm.homeTeam._id == this.team._id});

       let grouped = data.reduce((acc,cur)=>
         {
           let checkDate = new Date(cur.gameDate)

           let existing = acc.find((itm)=> {
           return itm.date >= checkDate && itm.date <= checkDate})

           if (existing) {
             existing.games.push(cur)
           } else {

             let calGame = new CalendaredGameModel(new Date(cur.gameDate), [cur])
             acc.push(calGame)
           }
           return acc
         }, []
       )
         this.dataLength = grouped.length
       return grouped
     }),
     tap ( (d:CalendaredGameModel[])=> {
      let lastGame = 0
      while (new Date(d[lastGame].date) < new Date()) {
        lastGame++
      }
      let pgIdx = Math.floor(lastGame/6)

      this.initialPgIdx = pgIdx;
      //this.paginator$.next({'pageIndex': pgIdx, 'pageSize': 6})
     }),
   )


     this.displayedGames$ =this.calendaredGames$.pipe(
       combineLatestWith(this.paginator$),
       map(([g, p])=> {

        g.sort((a,b)=> {
          let ad = a.date
          let bd = b.date

          return (ad < bd) ? -1 : ((ad == bd) ? 0 : 1) })

         return g.slice(p.pageSize * (p.pageIndex), p.pageSize * (p.pageIndex + 1))
       })
     )


  }


   public handlePage(e: any) {
      this.paginator$.next(e)
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
