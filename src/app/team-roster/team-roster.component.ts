import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Subscription, Subject } from 'rxjs';
import { RosterService } from './../core/services/roster.service';
import { LineupModel, SubmitLineup, LineupFormModel } from './../core/models/lineup.model';

const submitObj = ({lineupId, rosterId, effectiveDate, roster })=>{
  var output = {_id: rosterId, effectiveDate: effectiveDate, roster: []}
  
  roster.forEach((r)=> {
    //r.player = r.player._id
    output.roster.push({
      _id: r._id,
      player: r.player._id,
      lineupPosition: r.lineupPosition, 
      rosterOrder: r.rosterOrder, 
                       })
  })
  return output; 
};


@Component({
  selector: 'app-team-roster',
  templateUrl: './team-roster.component.html',
  styleUrls: ['./team-roster.component.scss']
})
export class TeamRosterComponent implements OnInit {
  @Input() lineup: LineupFormModel;
  @Input() originalLineup: LineupModel;
  @Input() editable: boolean;
  @Output() dropPlyr = new EventEmitter<{playerId: string}>(); 
  @Output() update = new EventEmitter<{lineup: SubmitLineup}>();
  
  formLineup: LineupFormModel;
  
  saveRosterRecordSub: Subscription;
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  
  constructor( public rosterService: RosterService) { }

  ngOnInit() {
    
  }
  
  dropLineupRecord(event: CdkDragDrop<any>) {
    moveItemInArray(this.lineup.roster, event.previousIndex, event.currentIndex);
  }
  
  lineupDirty(): boolean {
    for (var j =0; j<this.lineup.roster.length; j++) {
      var rr = this.lineup.roster[j]
      if (rr.rosterOrder != (j+1) || rr.lineupPosition != this.originalLineup.roster[j].lineupPosition) {
        return true
      }

    }
  }
  
  _dropPlyr(playerId) {
    this.dropPlyr.emit({playerId: playerId});
  }
  
  _getSubmitRoster() {
       
    for (var j =0; j<this.lineup.roster.length; j++) {
      var rr = this.lineup.roster[j]
      if (rr.rosterOrder != (j+1) || rr.lineupPosition != this.originalLineup.roster[j].lineupPosition) {
        rr.rosterOrder = j+1;
      }

    }

    var submitRoster= <SubmitLineup>submitObj(this.lineup);
    return submitRoster;

  }
  
  
  _updateRosterRecord() {
    
     const submitRoster = this._getSubmitRoster()
     if (submitRoster) {
       this.update.emit({lineup: submitRoster})
     }

  }
  

  
  abl(plyrStats) { 
    return (plyrStats.hits * 25 + 
       plyrStats.doubles * 10 + 
            plyrStats.triples * 20 +
            plyrStats.homeRuns * 40 + 
            plyrStats.baseOnBalls * 10 + 
            plyrStats.intentionalWalks * 10 + 
            plyrStats.stolenBases * 7 + 
            plyrStats.caughtStealing * (-7)  + 
            (plyrStats.sacBunts + plyrStats.sacFlies) * 5) / plyrStats.atBats - 4.5
  }
  
}
