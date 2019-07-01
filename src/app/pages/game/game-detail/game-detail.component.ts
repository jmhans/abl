// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { GameModel, PopulatedGameModel } from './../../../core/models/game.model';
import { StatlineModel } from './../../../core/models/statline.model';
import { AblGameService } from './../../../core/services/abl-game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})
export class GameDetailComponent {
  @Input() game: PopulatedGameModel;
  potentialStatlines: [StatlineModel];
  statsSub: Subscription;
  loading: boolean;
  error: boolean;
  

  constructor(
    public utils: UtilsService,
    public auth: AuthService, 
    public ablGame: AblGameService
  ) { }
  
  ngOnInit() {
    this.getPlayers();
  }
  
  getPlayers() {
    var obsArr = []
    this.game.awayTeamRoster.forEach((rosterRec) => {
      this.statsSub = this.ablGame
      .getGameStatsForPlayer$(rosterRec.player["mlbID"], this.game.gameDate)
      .subscribe(
        res => {
          res.forEach((sl)=> {
            this.potentialStatlines.push(sl);  
          })
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
    })
    
  }


}
