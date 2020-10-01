import { Component, OnInit } from '@angular/core';
import { Roster } from '../roster';
import { RosterService } from '../roster.service';
import { RosterDetailsComponent } from '../roster-details/roster-details.component';

@Component({
  selector: 'roster-list',
  templateUrl: './roster-list.component.html',
  styleUrls: ['./roster-list.component.css'],
  providers: [RosterService]
})

export class RosterListComponent implements OnInit {

  rosters: Roster[]
  selectedRoster: Roster

  constructor(private rosterService: RosterService) { }

  ngOnInit() {
     this.rosterService
      .getRosters()
      .subscribe((rosters: Roster[]) => {
        this.rosters = rosters;
      });
  }

  private getIndexOfRoster = (rosterId: String) => {
    return this.rosters.findIndex((roster) => {
      return roster._id === rosterId;
    });
  }

  selectRoster(roster: Roster) {
    this.selectedRoster = roster
  }

  createNewRoster() {
    var roster: Roster = {
      teamId: '',
      players: []
    };

    // By default, a newly-created roster will have the selected state.
    this.selectRoster(roster);
  }

  deleteRoster = (rosterId: String) => {
    var idx = this.getIndexOfRoster(rosterId);
    if (idx !== -1) {
      this.rosters.splice(idx, 1);
      this.selectRoster(null);
    }
    return this.rosters;
  }

  addRoster = (roster: Roster) => {
    this.rosters.push(roster);
    this.selectRoster(roster);
    return this.rosters;
  }

  updateRoster = (roster: Roster) => {
    var idx = this.getIndexOfRoster(roster._id);
    if (idx !== -1) {
      this.rosters[idx] = roster;
      this.selectRoster(roster);
    }
    return this.rosters;
  }
}