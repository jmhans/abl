import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../core/api.service';
import { UtilsService } from './../../core/utils.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-standings',
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.scss']
})
export class StandingsComponent implements OnInit, OnDestroy {

 pageTitle = 'Standings';
  standingsSub: Subscription;
  standings: any[];
  
  loading: boolean;
  error: boolean;
  
  
  constructor(
    private title: Title,
    public utils: UtilsService,
     public api: ApiService,
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this._getStandings();
    
  }

  private _getStandings() {
    this.loading = true;
    // Get future, public events
    this.standingsSub = this.api
      .getAPIData$('standings')
      .subscribe(
        res => {
          this.standings = res;
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }




  ngOnDestroy() {
    this.standingsSub.unsubscribe();
  }
  

}





