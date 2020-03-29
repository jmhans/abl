import { Component, OnInit, Input } from '@angular/core';

interface PlayerInterface {
  _id: string; 
  player: {
    player: {
      _id: string;
      mlbId: string;
      name: string;
      team: string;
      position: string;
      
    };
    lineupPosition: string;
    rosterOrder: number;
  };
  dailyStats: {
    gamePk: string[];
    gameDate: string[]; 
    "positions(s)": string[];
    'g': number;
    'ab': number;
    'h': number;
    '2b': number;
    '3b': number;
    'hr': number;
    'bb': number;
    'ibb': number;
    'hbp': number;
    'sb': number;
    'cs': number;
    'sac': number;
    'sf': number;
    'e': number;
  }; 
  played: boolean;
  playedPosition: string;
    
}



@Component({
  selector: 'app-player-game-line',
  templateUrl: './player-game-line.component.html',
  styleUrls: ['./player-game-line.component.scss']
})
export class PlayerGameLineComponent implements OnInit {

  @Input() player: PlayerInterface;
  constructor() { }

  ngOnInit() {
  }

}