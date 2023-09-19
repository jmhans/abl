import { Component, OnInit, Input, Output, EventEmitter , AfterViewInit} from '@angular/core';
import { CdkDragDrop, CdkDragSortEvent, moveItemInArray, transferArrayItem, CdkDrag } from '@angular/cdk/drag-drop';
import { Subscription, Subject, Observable,  of , BehaviorSubject} from 'rxjs'
import { map , startWith, switchMap} from 'rxjs/operators';
import { RosterService } from './../core/services/roster.service';
import { ApiService} from './../core/api.service';
import { LineupModel, SubmitLineup, LineupFormModel , Roster} from './../core/models/lineup.model';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table'

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
  dispRoster$: Observable<MatTableDataSource<Roster>>
  refreshLineup$:Subject<void> = new Subject();
  dropsAllowed: boolean = true;
  rosterLength: Number;
  activeRosterLength:Number;
  columnNames: ['drag_handle', 'lineupPosition', 'player.name', 'player.status', 'abl_runs', 'player.stats.batting.gamesPlayed','player.stats.batting.atBats', 'player.stats.batting.hits', 'player.stats.batting.doubles', 'player.stats.batting.triples', 'player.stats.batting.homeRuns', 'player.stats.batting.baseOnBalls', 'player.stats.batting.hitByPitch', 'player.stats.batting.stolenBases', 'player.stats.batting.caughtStealing']

  saveRosterRecordSub: Subscription;
  availablePositions: string[] = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH']

  constructor( public rosterService: RosterService) { }

  ngOnInit() {

    this.displayRoster$ = this.roster$.pipe(
      map((r)=> {


        const plyrs = r.map((plyr, pIdx)=> {
          return plyr
        })
        const ds = new MatTableDataSource(plyrs)
        return ds
      })
    )

this.dispRoster$ = this.refreshLineup$.pipe(
  switchMap(() => of(this.lineup) ),
  map((l)=> {
    const ds = new MatTableDataSource(l.roster)
    this.rosterLength =l.roster.filter((p)=> {return p.player.ablstatus.acqType == 'draft'}).length
    return ds
  })
)


  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.roster$.next(this.lineup.roster);
      this.refreshLineup$.next();
    });

  }

getActiveRosterLength() {
  return this.lineup.roster.filter((p)=> p.lineupPosition != 'INJ' && p.lineupPosition != 'NA').length
}


alternate_elig(plyr) {
  if (!plyr.status) return 'NA'
  if (plyr.status.indexOf('Injured') != -1) return 'INJ'
  if (plyr.status.indexOf('Minors') != -1) return 'NA'
  return ''
}

ineligiblePositions() {
  let inel = this.lineup.roster.filter((p)=> {
    let elig = [...p.player.eligible, this.alternate_elig(p.player)]
    return elig.indexOf(p.lineupPosition) == -1
  })
  return inel
}

saveable() {
  return this.ineligiblePositions().length == 0 && this.lineup.changed && this.editable
}


dropPlayerAllowed(plyrRec) {
  let now = new Date()
  let draftedRosterLength = this.rosterLength


  let suppDraftPrep = now >= new Date('2023-06-11T18:00:01Z') && now <=new Date('2023-06-12T00:58:00')
  return plyrRec.player.ablstatus.acqType == 'pickup' || (suppDraftPrep &&draftedRosterLength>22)
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
    } else if ((this.lineup.roster[event.previousIndex].player.ablstatus.acqType == 'draft' || this.lineup.roster[event.previousIndex].player.ablstatus.acqType == 'supp_draft') && event.currentIndex + 1 >= pickupMin) {
      // This is an issue. You've tried to move a drafted player lower than a pickup.
      this._rosterAlert(`${this.lineup.roster[event.previousIndex].player.name} was a drafted player, and cannot be placed lower than a pickup.`)
    } else {
      //this.lineup.roster[event.previousIndex].rosterOrder = event.currentIndex + 1
      moveItemInArray(this.lineup.roster, event.previousIndex, event.currentIndex);
      //const ds = new MatTableDataSource(this.lineup.roster);
      //this.lineup.recalcOrder();

      this.roster$.next(this.lineup.roster)
      this.refreshLineup$.next()
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
    this.refreshLineup$.next();
  }

  plyrChanged<Boolean>(plyr) {
 //   let storedPlyr = this.originalLineup.roster.find((p)=> p.player.mlbID == plyr.player.mlbID)
    let origIdx = this.originalLineup.roster.findIndex((r)=> {return r.player.mlbID == plyr.player.mlbID})
    return !(origIdx == this.lineup.roster.findIndex((r)=> {return r.player.mlbID == plyr.player.mlbID}) && this.originalLineup.roster[origIdx].lineupPosition == plyr.lineupPosition)

    //const rosterPlyrIdx = this.lineup.roster.findIndex((r)=> {return JSON.stringify(r) == JSON.stringify(plyr)})
    //const rosterOrderCheck =rosterPlyrIdx != plyr.rosterOrder - 1
    //const positionCheck = plyr.changed
    //return rosterOrderCheck || positionCheck
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
    if (plyrStats) {
    return (plyrStats.hits * 25 +
       plyrStats.doubles * 10 +
            plyrStats.triples * 20 +
            plyrStats.homeRuns * 30 +
            plyrStats.baseOnBalls * 10 +
            plyrStats.hitByPitch * 10 +
            plyrStats.stolenBases * 7 +
            plyrStats.caughtStealing * (-7)  +
            (plyrStats.sacBunts || 0 + plyrStats.sacFlies || 0) * 5) / plyrStats.atBats - 4.5
          }
        else  {
          return -99.99

        }
      }

}
