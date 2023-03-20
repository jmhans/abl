
// src/app/pages/admin/team-form/owner-form/owner-form.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl, UntypedFormArray } from '@angular/forms';
import { AblTeamModel, FormTeamModel, OwnerInterface } from './../../../../core/models/abl.team.model';

@Component({
  selector: 'app-owner-form',
  templateUrl: './owner-form.component.html',
  styleUrls: ['./owner-form.component.scss']
})
export class OwnerFormComponent implements OnInit {
  @Input() owners: OwnerInterface[];
  ownerForm: UntypedFormGroup;
  formOwners: UntypedFormArray;
  userIsOwner: boolean;

  constructor(    private fb: UntypedFormBuilder) { }

  ngOnInit() {
    
    this.ownerForm = this.fb.group({
      owners: this.fb.array( this.owners.map((owner) => this.createFormOwner(owner)) )
    });
    
  }
  
  createFormOwner(owner): UntypedFormGroup {
    return this.fb.group({
      name: owner.name,
      email: owner.email,
      userId: owner.userId, 
      verified: owner.verified
    })
  }
  
  
  createOwner(): UntypedFormGroup {
    return this.fb.group({
      name: '',
      email: '',
      userId: '',
      verified: false,
    });
  }
  
  addOwner(): void {
    this.formOwners = this.ownerForm.get('owners') as UntypedFormArray;
    this.formOwners.push(this.createOwner());
  }
  
}