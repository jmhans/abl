import { Component, OnInit, Input , Output, EventEmitter} from '@angular/core';
import { WavesModule } from 'angular-bootstrap-md';
import {CdkDragDrop, CdkDragEnter, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { playerModel } from './../../../../core/models/roster.record.model';

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
  @Input() oppScore: ablgameScore;
  @Input() homeTeam: boolean;
  @Input() status: string;
  @Input() editable: boolean;
  @Output() updateScore = new EventEmitter<ablgameScore>(); 

  
  
  showBench: boolean = false;
  active: any[];
  bench: any[];
  dragTarget: any;
  dragging: boolean;
  dragSource: string;
  editField: string;
  regulation_score = ()=>this.score(this.active.filter((plyr) => {return (plyr.playedPosition != 'XTRA')}),  this.oppScore.regulation.e )
  final_score = ()=>this.score(this.active,  this.oppScore.final.e )
  

    displayedColumns: string[] = ['position', 'name', 'games',  'atbats', 'hits','doubles', 'triples', 'homeruns', 'bb', 'hbp', 'sac', 'sacflies', 'stolenBases', 'caughtStealing', 'errors', 'ablruns'];

  constructor() { }

  ngOnInit(): void {
    this.active = this.roster.filter((p)=> {return p.ablstatus == 'active'});
    this.bench = this.roster.filter((p)=> {return p.ablstatus != 'active'})
    
    
  }
  
  drop(event: CdkDragDrop<playerModel[]>) {
    
    
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
      
      var droppedPlyr: playerModel = event.container.data[event.currentIndex]
      
      if (droppedPlyr.ablstatus == 'active') {
        droppedPlyr.ablstatus = null
        droppedPlyr.ablRosterPosition = null
          droppedPlyr.ablPlayedType = null
          droppedPlyr.playedPosition = null
      } else {
        // Used to be bench
        droppedPlyr.ablstatus = 'active'
        droppedPlyr.ablRosterPosition = null
        droppedPlyr.ablPlayedType = 'SUB'
        droppedPlyr.playedPosition = null
      }
      this.updateTeamScore();
    }
    
  }
  enter(event: CdkDragEnter<string[]>) {
    
    
  }
  toggleDrag(dragSource: string ) {
    
    this.dragging = !this.dragging
    this.dragSource = dragSource
  }
  
  
    updateStatList(id: number, property: string, event: any) {
      const editField = event.target.textContent;
      this.active[id].dailyStats[property] = editField;
      
    }

    updateList(id: number, obj: any, property: string, event: any, stat: boolean = false) {
      const editField = event.target.textContent;
      
      // Need to update score if appropriate...
      
      if (stat) {
        obj[property] = parseInt(editField);
          this.updateScoreForPlyr(obj)
          this.updateTeamScore();
          } else {
            obj[property] = editField;
          }

    }
  
//     remove(id: any) {
//       this.awaitingPersonList.push(this.personList[id]);
//       this.personList.splice(id, 1);
//     }

//     add() {
//       if (this.awaitingPersonList.length > 0) {
//         const person = this.awaitingPersonList[0];
//         this.personList.push(person);
//         this.awaitingPersonList.splice(0, 1);
//       }
//     }

    changeStatValue(id: number, property: string, event: any) {
      this.editField = event.target.textContent;
    }
  updateTeamScore(external:boolean = false) {
    this.teamScore = {regulation : this.regulation_score(), final: this.final_score()}
    if (!external) {
      this.updateScore.emit(this.teamScore);
    }
    
  }
  
  updateScoreForPlyr (stats) {
    var retObj = stats;
    var ablPts = 
        25 * (retObj.h || 0) + 
        10 * (retObj["2b"] || 0)+ 
        20 * (retObj["3b"] || 0) + 
        30 * (retObj.hr || 0) + 
        10 * (retObj.bb || 0) + 
        10 * (retObj.ibb || 0)+ 
        10 * (retObj.hbp || 0) + 
        7 * (retObj.sb - retObj.cs || 0) + 
        5 * (retObj.sac + retObj.sf || 0);
    
     var ablruns = ablPts / retObj.ab - 0.5 * retObj.e - 4.5;
    retObj.abl_points = ablPts;
    retObj.abl_score = {abl_runs: ablruns, abl_points: ablPts, e: retObj.e, ab: retObj.ab};
  }
  
  
  score(playerList, oppErrors = 0) {
    return playerList.reduce((total, curPlyr) => {
      total.abl_points += (curPlyr.dailyStats.abl_points || 0);
        if (!["DH", "XTRA"].includes(curPlyr.playedPosition)  ) {
          // Player played in DH or XTRA spot, so errors are not counted toward team total. 
          total.e += (curPlyr.dailyStats.e || 0);
        }
        
        ["g", "ab", "h", "2b", "3b", "hr", "bb", "hbp", "sac", "sf", "sb", "cs"].forEach((prop) => {
          total[prop] += parseInt(curPlyr.dailyStats[prop]) || 0
        })
      
        // total.ab += (curPlyr.dailyStats.ab || 0);
        
        total.abl_runs = total.abl_points / total.ab + 0.5 * oppErrors  - 4.5 + (this.homeTeam ?  0.5 : 0 );
      
      return total;
      
      }, {abl_runs: 0, abl_points: 0, e: 0, ab: 0, g:0, h:0, "2b": 0, "3b":0, hr:0, bb:0, hbp:0, sac:0, sf:0, sb:0, cs:0 , opp_e: oppErrors})
  }
    
}
