import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Hero } from '../hero';
// import { HeroService } from '../hero.service';

// import { Owner } from '../owners/owner';
// import { OwnerService } from '../owners/owner.service';
// import { MlbDataService } from '../mlb-data.service';
// import {  MLBSchedule, MLBGame } from '../mlbgame';
import { Title } from '@angular/platform-browser';

import { ApiService } from './../core/api.service';
import { UtilsService } from './../core/utils.service';
import { FilterSortService } from './../core/filter-sort.service';
import { Subscription } from 'rxjs';
// import { EventModel } from './../core/models/event.model';
import { AblTeamModel } from './../core/models/abl.team.model';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})

export class DashboardComponent implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';
  teamListSub: Subscription;
  teamList: AblTeamModel[];
  filteredTeams: AblTeamModel[];
//   eventListSub: Subscription;
//   eventList: EventModel[];
//   filteredEvents: EventModel[];
  loading: boolean;
  error: boolean;
  query: '';
  
//   owners: Owner[] = [];
//   schedData: MLBGame[] = [];
  constructor(private title: Title, 
//                private ownerService: OwnerService, 
//               private MlbDataService: MlbDataService, 
              public utils: UtilsService, 
              private api: ApiService, 
              public fs: FilterSortService) { }

  ngOnInit() {
   //this.getOwners();
    //this.getGames();
    this.title.setTitle(this.pageTitle);
   // this._getEventList();
    this._getTeamList();
  }

//   getOwners(): void {
// //     this.heroService.getHeroes()
// //       .subscribe(heroes => this.heroes = heroes.slice(1, 5));
//     this.ownerService.getOwners2()
//       .subscribe(owners => this.owners = owners)
//   }
  
//   getGames(): void {
//     this.MlbDataService.getGamesForDate()
//     .subscribe(sched => this.schedData = sched)
//   }
  
//   private _getEventList() {
//     this.loading = true;
//     // Get future, public events
//     this.eventListSub = this.api
//       .getEvents$()
//       .subscribe(
//         res => {
//           this.eventList = res;
//           this.filteredEvents = res;
//           this.loading = false;
//         },
//         err => {
//           console.error(err);
//           this.loading = false;
//           this.error = true;
//         }
//       );
//   }
  
  private _getTeamList() {
    this.loading = true;
    // Get future, public events
    this.teamListSub = this.api
      .getAblTeams$()
      .subscribe(
        res => {
          this.teamList = res;
          this.filteredTeams = res;
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }

//   searchEvents() {
//     this.filteredEvents = this.fs.search(this.eventList, this.query, '_id', 'mediumDate');
//   }
  
  searchTeams() {
    this.filteredTeams = this.fs.search(this.teamList, this.query, '_id', 'mediumDate');
  }

  resetQuery() {
    this.query = '';
   // this.filteredEvents = this.eventList;
    this.filteredTeams = this.teamList;
  }

  ngOnDestroy() {
   // this.eventListSub.unsubscribe();
    this.teamListSub.unsubscribe();
  }
  
}