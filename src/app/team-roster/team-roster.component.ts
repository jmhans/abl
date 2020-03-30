import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Subscription, Subject } from 'rxjs';
import { RosterService } from './../core/services/roster.service';
import { LineupModel, SubmitLineup } from './../core/models/lineup.model';


// interface LineupInterface {
//   _id: string; 
//   effectiveDate: Date;
//   ablTeam: {};
//   roster: [{
//     "_id": string;
//     "player": string;
//     "ablTeam": string; //Make it a team object...
//     "lineupPosition": string;
//     "rosterOrder": number;
//     "originalPosition": string;
//            }];  
// }

const submitObj = ({_id, effectiveDate, roster })=>{
  var output = {_id: _id, effectiveDate: effectiveDate, roster: []}
  
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
  @Input() lineupId: string;
  @Input() lineup: LineupModel;
  @Input() editable: boolean;
  @Output() updated = new EventEmitter<{success: boolean, data?: LineupModel, err?: string}>();
  
  saveRosterRecordSub: Subscription;
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']
  
  constructor( public rosterService: RosterService) { }

  ngOnInit() {
  }
  
  dropLineupRecord(event: CdkDragDrop<any>) {
    moveItemInArray(this.lineup.roster, event.previousIndex, event.currentIndex);
  }
  
  _getSubmitRoster() {
    var diffs = false;
    
    for (var j =0; j<this.lineup.roster.length; j++) {
      var rr = this.lineup.roster[j]
      if (rr.rosterOrder != (j+1) || rr.lineupPosition != rr.originalPosition) {
        diffs = true;
        rr.rosterOrder = j+1;
      }

    }

    var submitRoster= <SubmitLineup>submitObj(this.lineup);
    return submitRoster;

  }
  
  
  _updateRosterRecord() {
    const submitRoster = this._getSubmitRoster()
    if (submitRoster) {
      this.saveRosterRecordSub = this.rosterService
        .updateRosterRecord$(this.lineupId, submitRoster)
        .subscribe(
          data => this._handleLineupSuccess(data),
          err => this._handleUpdateError(err)
      )      
    }

  }
  
  private _handleLineupSuccess(res) {
    this.updated.emit({success: true, data: res});
  }
  
  private _handleUpdateError(err) {
    console.error(err);
    this.updated.emit({success: false, err: err});
//    this.alerts.push({type:'danger', message:'Lineup not saved'});
//    this.error = true;
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
