import { Component, OnInit, Input, Output, EventEmitter , AfterViewInit} from '@angular/core';
import { CdkDragDrop, CdkDragSortEvent, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Subscription, Subject, Observable,  of } from 'rxjs'
import { map , startWith} from 'rxjs/operators';
import { RosterService } from './../core/services/roster.service';
import { LineupModel, SubmitLineup, LineupFormModel , Roster} from './../core/models/lineup.model';
import { MatTableDataSource } from '@angular/material/table'



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
export class TeamRosterComponent implements OnInit, AfterViewInit {
  @Input() lineup: LineupFormModel;
  @Input() originalLineup: LineupModel;
  @Input() editable: boolean;
  @Output() dropPlyr = new EventEmitter<{playerId: string}>();
  @Output() update = new EventEmitter<{lineup: SubmitLineup}>();
  @Output() raiseAlert = new EventEmitter<any>();
  lineupChanged: Boolean = false;
  formLineup: LineupFormModel;
  roster$: Subject<Roster[]>= new Subject();
  displayRoster$: Observable<MatTableDataSource<Roster>>

  saveRosterRecordSub: Subscription;
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']

  constructor( public rosterService: RosterService) { }

  ngOnInit() {


    this.displayRoster$ = this.roster$.pipe(
      map((r)=> {
        this.lineupChanged = false
        const plyrs = r.map((plyr, pIdx)=> {

          const originalPlyr = this.originalLineup.roster.find((op)=> {return op.player.mlbID == plyr.player.mlbID})
          if (originalPlyr) {
            plyr.changed = (originalPlyr.lineupPosition != plyr.lineupPosition || (pIdx + 1) != originalPlyr.rosterOrder)

            if (plyr.changed) {
              this.lineupChanged = true
            }
          }
          plyr.player.abl = this.abl(((plyr.player || {}).stats || {}).batting)
          plyr.player.fortyMan = new Date((plyr.player ||{}).lastUpdate) >= new Date (new Date(plyr.latest40Man).getTime() - 2 * 60 * 60000)

          return plyr
        })
        const ds = new MatTableDataSource(plyrs)
        return ds
      })
    )


  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.roster$.next(this.lineup.roster);
    });

  }
  dropLineupRecord(event: CdkDragDrop<any>) {
    console.log(`Item moved:`);
    console.log(event)
    console.log(this.lineup.roster);

    var pickupMin = this.lineup.roster.reduce((prev, cur)=> {
      if (cur.player.ablstatus.acqType == 'pickup') {
        return Math.min(cur.rosterOrder, prev)
      } else {
        return prev
      }
    }, Infinity)

    if (this.lineup.roster[event.previousIndex].player.ablstatus.acqType == 'pickup' && event.currentIndex +1 < pickupMin) {
      // This is an issue. I've tried to move a pickup ahead of a drafted player.
      this._rosterAlert(`${this.lineup.roster[event.previousIndex].player.name} was a post-draft pickup, and cannot be placed higher than a drafted player.`)
    } else if (this.lineup.roster[event.previousIndex].player.ablstatus.acqType == 'draft' && event.currentIndex + 1 >= pickupMin) {
      // This is an issue. You've tried to move a drafted player lower than a pickup.
      this._rosterAlert(`${this.lineup.roster[event.previousIndex].player.name} was a drafted player, and cannot be placed lower than a pickup.`)
    } else {
      moveItemInArray(this.lineup.roster, event.previousIndex, event.currentIndex);
      //const ds = new MatTableDataSource(this.lineup.roster);
      this.roster$.next(this.lineup.roster)
    }





  }

  sorted(event: CdkDragSortEvent<any>) {
    console.log(`Sorted: ${event}`);
  }

  lineupDirty(): boolean {
    for (var j =0; j<this.lineup.roster.length; j++) {
      var rr = this.lineup.roster[j]
      if (rr.rosterOrder != (j+1)
          || rr.lineupPosition != this.originalLineup.roster[j].lineupPosition
          || rr.player.mlbID != this.originalLineup.roster[j].player.mlbID
         ) {
        return true
      }

    }
  }
  changePos(evt) {
    this.roster$.next(this.lineup.roster);
  }


  _dropPlyr(playerId) {
    this.dropPlyr.emit({playerId: playerId});
  }

  _rosterAlert(msg) {
    this.raiseAlert.emit({message: msg})
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
            plyrStats.homeRuns * 30 +
            plyrStats.baseOnBalls * 10 +
            plyrStats.hitByPitch * 10 +
            plyrStats.stolenBases * 7 +
            plyrStats.caughtStealing * (-7)  +
            (plyrStats.sacBunts + plyrStats.sacFlies) * 5) / plyrStats.atBats - 4.5
  }

}
