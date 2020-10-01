import { Component, Input } from '@angular/core';
import { Roster } from '../roster';
import { RosterService } from '../roster.service';

@Component({
  selector: 'roster-details',
  templateUrl: './roster-details.component.html',
  styleUrls: ['./roster-details.component.css']
})

export class RosterDetailsComponent {
  @Input()
  roster: Roster;

  @Input()
  createHandler: Function;
  @Input()
  updateHandler: Function;
  @Input()
  deleteHandler: Function;

  constructor (private rosterService: RosterService) {}

  createRoster(roster: Roster) {
    this.rosterService.createRoster(roster).subscribe((newRoster: Roster) => {
      this.createHandler(newRoster);
    });
  }
  addPlayer(roster: Roster) {
    roster.players.push('');
  }
  
  
  
  
}
