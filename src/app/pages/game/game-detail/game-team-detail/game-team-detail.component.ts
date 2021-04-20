import { Component, OnInit, Input  } from '@angular/core';
import { WavesModule } from 'angular-bootstrap-md';
import {CdkDragDrop, CdkDragEnter, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';


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

  @Input() roster: any[]; // gameTeam ;
  @Input() teamScore: ablgameScore;
  @Input() status: string;
  showBench: boolean = false;
  active: any[];
  bench: any[];
  dragTarget: any;
  dragging: boolean;
  dragSource: string;
  

    displayedColumns: string[] = ['position', 'name', 'games',  'atbats', 'hits','doubles', 'triples', 'homeruns', 'bb', 'hbp', 'sac', 'sacflies', 'stolenBases', 'caughtStealing', 'errors', 'ablruns'];

  constructor() { }

  ngOnInit(): void {
    this.active = this.roster.filter((p)=> {return p.ablstatus == 'active'});
    this.bench = this.roster.filter((p)=> {return p.ablstatus != 'active'})
    
    
  }
  
  drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    console.log(this.active)
    
    
  }
  enter(event: CdkDragEnter<string[]>) {
    
    
  }
  toggleDrag(dragSource: string ) {
    
    this.dragging = !this.dragging
    this.dragSource = dragSource
    console.log(`Dragging: ${this.dragging}`)
  }
  

}
