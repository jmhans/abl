import { Component, OnInit, Input  } from '@angular/core';
import { WavesModule } from 'angular-bootstrap-md';


interface ablgameScore {
  regulation: abltotals
  final: abltotals
}

interface abltotals {
  abl_runs: number
  abl_points: number
  e: number
  ab: number
  g:number
  h:number
  "2b": number
  "3b": number
  hr:number
  bb: number
  hbp:number
  sac:number 
  sf:number
  sb:number
  cs:number
}


interface gameTeam {
  away_score: ablgameScore 
  home_score: ablgameScore
  awayTeam: {}
  homeTeam: {}
}


@Component({
  selector: 'app-game-team-detail',
  templateUrl: './game-team-detail.component.html',
  styleUrls: ['./game-team-detail.component.scss']
})




export class GameTeamDetailComponent implements OnInit {

  @Input() roster: gameTeam ;
  @Input() teamScore: ablgameScore;
  @Input() status: string;
  showBench: boolean = false;
  
  

    displayedColumns: string[] = ['position', 'name', 'games',  'atbats', 'hits','doubles', 'triples', 'homeruns', 'bb', 'hbp', 'sac', 'sacflies', 'stolenBases', 'caughtStealing', 'errors', 'ablruns'];

  constructor() { }

  ngOnInit(): void {
  }

}
