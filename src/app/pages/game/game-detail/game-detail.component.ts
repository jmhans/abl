// src/app/pages/game/game-detail/game-detail.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { GameModel } from './../../../core/models/game.model';

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})
export class GameDetailComponent {
  @Input() game: GameModel;

  constructor(
    public utils: UtilsService,
    public auth: AuthService
  ) { }

}
