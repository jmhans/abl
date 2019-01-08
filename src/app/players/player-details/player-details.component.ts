import { Component, Input } from '@angular/core';
import { Player } from '../player';
import { PlayerService } from '../player.service';

@Component({
  selector: 'player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.css']
})

export class PlayerDetailsComponent {
  @Input()
  player: Player;

  @Input()
  createHandler: Function;
  @Input()
  updateHandler: Function;
  @Input()
  deleteHandler: Function;

  constructor (private playerService: PlayerService) {}

  createPlayer(player: Player) {
    this.playerService.createPlayer(player).then((newPlayer: Player) => {
      this.createHandler(newPlayer);
    });
  }

  updatePlayer(player: Player): void {
    this.playerService.updatePlayer(player).then((updatedPlayer: Player) => {
      this.updateHandler(updatedPlayer);
    });
  }

  deletePlayer(playerId: String): void {
    this.playerService.deletePlayer(playerId).then((deletedPlayerId: String) => {
      this.deleteHandler(deletedPlayerId);
    });
  }
}
