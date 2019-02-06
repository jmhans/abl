import { Component, OnInit } from '@angular/core';

import { Owner } from './owner';
import { OwnerService } from './owner.service';
import { Team } from './owner';


@Component({
  selector: 'app-owners',
  templateUrl: './owners.component.html',
  styleUrls: ['./owners.component.css']
})
export class OwnersComponent implements OnInit {
  owners: Owner[];
  team: Team;
  constructor(private ownerService: OwnerService) { }

  ngOnInit() {
    this.getOwners();
  }
  getOwners(): void {
    this.ownerService.getOwners2()
    .subscribe(owners => this.owners = owners);
  }
  add(name: string, email: string): void {
    name = name.trim();
    email = email.trim();
    if ((!name) || (!email)) { return; }
    this.ownerService.addOwner({ name, email } as Owner)
      .subscribe(owner => {
        this.owners.push(owner);
      });
  }

  
  delete(owner: Owner): void {
    this.owners= this.owners.filter(o => o !== owner);
    this.ownerService.deleteOwner2(owner).subscribe();
  }
  
}

