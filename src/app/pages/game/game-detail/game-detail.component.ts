// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { GameModel, PopulatedGameModel } from './../../../core/models/game.model';
import { StatlineModel } from './../../../core/models/statline.model';
import { LineupModel } from './../../../core/models/lineup.model';
import { AblGameService } from './../../../core/services/abl-game.service';
import { RosterService } from './../../../core/services/roster.service';
import { Subscription, interval, Observable, from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

  interface potentialSL {
    tm: string
    plyrs: StatlineModel[]
  }

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})


export class GameDetailComponent {
  
  @Input() game: PopulatedGameModel;
  rosters: LineupModel[];
  potentialStatlines: object;
  statsSub: Subscription;
  RosterSub: Subscription;
  loading: boolean;
  error: boolean;
  

  constructor(
    public utils: UtilsService,
    public auth: AuthService, 
    public ablGame: AblGameService, 
    public rosterService: RosterService
  ) { }
  
  ngOnInit() {
    this.rosters = [];
    this._getRosters();
    //this.getStats();
    
  }
  
  _getRosters() {
    
    this.potentialStatlines = {};
    
    this.statsSub = this.ablGame.getGameRosters$(this.game._id)
      .subscribe(res => {
        this.rosters = res;
      })
    
  }
  
  
  ngOnDestroy() {
   // this.RosterSub.unsubscribe();
    this.statsSub.unsubscribe();
  }


}
