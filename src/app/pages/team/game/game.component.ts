import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription } from 'rxjs';
import { AblGameService } from './../../../core/services/abl-game.service';
import { GameModel } from './../../../core/models/game.model';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import {MatDatepickerModule ,MatDatepickerInputEvent} from '@angular/material/datepicker';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from './../../../auth/auth.service';


@Component({
  selector: 'app-team-games',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class TeamGameComponent implements OnInit {
  @Input() team: AblTeamModel;
  
  pageTitle = 'Games';
  gamesListSub: Subscription;
  gamesList: GameModel[];
  filteredGames: GameModel[];
  loading: boolean;
  error: boolean;
  query: string = '';
  submitSub: Subscription;


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
  
  attest(gm: GameModel) {
    //this.api.postData$({})
    console.log(gm);
    
    this.submitSub = this.ablGame.attestGame$(gm._id, 
                                              gm.results.find((game_res)=>{return game_res.status == 'final'}), 
                                              {attester: this.auth.userProfile.sub, attesterType: this.ablGame.gameParticipant(gm, this.auth.userProfile.sub)}
                                              )
        .subscribe(res => {
          console.log(`Document updated: ${res}` );
          gm.results = res.results
        })     
  }
  
  _needsAttest(gm) {
    return gm.attesters.map((a)=> {return gm[a+'Team']._id}).indexOf(this.team._id) == -1
  }
  
  protest(gm) {
    console.log(gm);
    //this.api.postData$({})
  }
  getGameScore(gm_result, loc) {
    if (gm_result.scores) {
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
