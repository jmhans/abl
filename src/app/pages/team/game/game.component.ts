import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription } from 'rxjs';
import { GameModel } from './../../../core/models/game.model';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import {MatDatepickerModule ,MatDatepickerInputEvent} from '@angular/material/datepicker';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';


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


  constructor(
    private title: Title,
    public utils: UtilsService,
    private api: ApiService,
    public fs: FilterSortService, 
    private datePipe: DatePipe
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
  
  attest(gm) {
    //this.api.postData$({})
    console.log(gm);
  }
  
  protest(gm) {
    console.log(gm);
    //this.api.postData$({})
  }



  ngOnDestroy() {
    this.gamesListSub.unsubscribe();
  }
  
  hasProp(o, name) {
  return o.hasOwnProperty(name);
}


}
