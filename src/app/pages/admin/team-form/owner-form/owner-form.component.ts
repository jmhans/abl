
// src/app/pages/admin/team-form/owner-form/owner-form.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormArray } from '@angular/forms';
import { AblTeamModel, FormTeamModel, OwnerInterface } from './../../../../core/models/abl.team.model';

@Component({
  selector: 'app-owner-form',
  templateUrl: './owner-form.component.html',
  styleUrls: ['./owner-form.component.scss']
})
export class OwnerFormComponent implements OnInit {
  @Input() owners: OwnerInterface[];
  ownerForm: FormGroup;
  formOwners: FormArray;
  userIsOwner: boolean;

  constructor(    private fb: FormBuilder) { }

  ngOnInit() {
    
    this.ownerForm = this.fb.group({
      owners: this.fb.array( this.owners.map((owner) => this.createFormOwner(owner)) )
    });
    
  }
  
  createFormOwner(owner): FormGroup {
    return this.fb.group({
      name: owner.name,
      email: owner.email,
      userId: owner.userId, 
      verified: owner.verified
    })
  }
  
  
  createOwner(): FormGroup {
    return this.fb.group({
      name: '',
      email: '',
      userId: '',
      verified: false,
    });
  }
  
  addOwner(): void {
    this.formOwners = this.ownerForm.get('owners') as FormArray;
    this.formOwners.push(this.createOwner());
  }
  
}