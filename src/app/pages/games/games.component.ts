
// src/app/pages/games/games.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../core/api.service';
import { UtilsService } from './../../core/utils.service';
import { FilterSortService } from './../../core/filter-sort.service';
import { Subscription } from 'rxjs';
import { GameModel } from './../../core/models/game.model';
import {MatDatepickerModule ,MatDatepickerInputEvent} from '@angular/material/datepicker';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common';






@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss']
})
export class GamesComponent implements OnInit, OnDestroy {
  pageTitle = 'Games';
  gamesListSub: Subscription;
  gamesList: GameModel[];
  filteredGames: GameModel[];
  loading: boolean;
  error: boolean;
  query: string = '';
  modelDate: FormControl;

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
    this.modelDate = new FormControl(/*new Date()*/);
    
  }
  
  _dateChanged(type: string, event: MatDatepickerInputEvent<Date>) {
    //
    //this.filteredGames = this.fs.search(this.gamesList, this.datePipe.transform(this.modelDate.value, 'mediumDate'), '_id', 'mediumDate')
    //this.query = this.datePipe.transform(this.modelDate.value, 'mediumDate');
    this.searchGames();
  }

  private _getGamesList() {
    this.loading = true;
    // Get future, public events
    this.gamesListSub = this.api
      .getAblGames$()
      .subscribe(
        res => {
          this.gamesList = res;
          this.filteredGames = res;
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }

  getGameAttester(allAttestations, loc) {
    return allAttestations.find((a)=> {return a.attesterType == loc });
  }
  
  getGameScore(gm, loc) {
    if (gm.results && gm.results.scores) {
        return gm.results.scores.find((g)=> {return g.location == loc})    
    }
  }
  
  
  searchGames() {
    var searchInput = this.gamesList
    if (this.modelDate.value) { 
      searchInput = this.gamesList.filter((g)=> {return this.datePipe.transform(g.gameDate, 'mediumDate') == this.datePipe.transform(this.modelDate.value, 'mediumDate')})
    }
    this.filteredGames = this.fs.search(searchInput, this.query, '_id', 'mediumDate');
    
  }

  resetQuery() {
    this.modelDate.reset();
    this.query = '';
    this.filteredGames = this.gamesList;
  }

  ngOnDestroy() {
    this.gamesListSub.unsubscribe();
  }
  
  hasProp(o, name) {
  return o.hasOwnProperty(name);
}

}



