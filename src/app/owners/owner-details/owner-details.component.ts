import { Component, Input } from '@angular/core';
import { Owner } from '../owner';
import { OwnerService } from '../owner.service';

@Component({
  selector: 'owner-details',
  templateUrl: './owner-details.component.html',
  styleUrls: ['./owner-details.component.css']
})

export class OwnerDetailsComponent {
  @Input()
  owner: Owner;

  @Input()
  createHandler: Function;
  @Input()
  updateHandler: Function;
  @Input()
  deleteHandler: Function;

  constructor (private ownerService: OwnerService) {}

  createOwner(owner: Owner) {
    this.ownerService.createOwner(owner).then((newOwner: Owner) => {
      this.createHandler(newOwner);
    });
  }

  updateOwner(owner: Owner): void {
    this.ownerService.updateOwner(owner).then((updatedOwner: Owner) => {
      this.updateHandler(updatedOwner);
    });
  }

  deleteOwner(ownerId: String): void {
    this.ownerService.deleteOwner(ownerId).then((deletedOwnerId: String) => {
      this.deleteHandler(deletedOwnerId);
    });
  }
}