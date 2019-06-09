
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
  query: '';
  modelDate: FormControl;

  constructor(
    private title: Title,
    public utils: UtilsService,
    private api: ApiService,
    public fs: FilterSortService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this._getGamesList();
    this.modelDate = new FormControl(new Date());
    
  }
  
  private _dateChanged(type: string, event: MatDatepickerInputEvent<Date>) {
    //
    this.filteredGames = this.fs.search(this.gamesList, this.modelDate.value, '_id', 'mediumDate')
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

  searchGames() {
    this.filteredGames = this.fs.search(this.gamesList, this.query, '_id', 'mediumDate');
  }

  resetQuery() {
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



