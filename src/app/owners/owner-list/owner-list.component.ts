import { Component, OnInit } from '@angular/core';
import { Owner } from '../owner';
import { OwnerService } from '../owner.service';
import { OwnerDetailsComponent } from '../owner-details/owner-details.component';

@Component({
  selector: 'owner-list',
  templateUrl: './owner-list.component.html',
  styleUrls: ['./owner-list.component.css'],
  providers: [OwnerService]
})

export class OwnerListComponent implements OnInit {

  owners: Owner[]
  selectedOwner: Owner

  constructor(private ownerService: OwnerService) { }

  ngOnInit() {
     this.ownerService
      .getOwners()
      .then((owners: Owner[]) => {
        this.owners = owners.map((owner) => {
          return owner;
        });
      });
  }

  private getIndexOfOwner = (ownerId: String) => {
    return this.owners.findIndex((owner) => {
      return owner._id === ownerId;
    });
  }

  selectOwner(owner: Owner) {
    this.selectedOwner = owner
  }

  createNewOwner() {
    var owner: Owner = {
      name: '',
      email: ''
    };

    // By default, a newly-created owner will have the selected state.
    this.selectOwner(owner);
  }

  deleteOwner = (ownerId: String) => {
    var idx = this.getIndexOfOwner(ownerId);
    if (idx !== -1) {
      this.owners.splice(idx, 1);
      this.selectOwner(null);
    }
    return this.owners;
  }

  addOwner = (owner: Owner) => {
    this.owners.push(owner);
    this.selectOwner(owner);
    return this.owners;
  }

  updateOwner = (owner: Owner) => {
    var idx = this.getIndexOfOwner(owner._id);
    if (idx !== -1) {
      this.owners[idx] = owner;
      this.selectOwner(owner);
    }
    return this.owners;
  }
}
