// src/app/pages/admin/team-form/team-form.service.ts
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable()
export class TeamFormService {
  validationMessages: any;
  // Set up errors object
  formErrors = {
    nickname: '',
    location: '',
    stadium: '',
    ownerName: ''
  };
  // Min/maxlength validation
  textMin = 3;
  nicknameMax = 36;
  locMax = 200;
  textMax = 36;
  
  constructor() {
    this.validationMessages = {
      nickname: {
        required: `Nickname is <strong>required</strong>.`,
        minlength: `Nickname must be ${this.textMin} characters or more.`,
        maxlength: `Nickname must be ${this.nicknameMax} characters or less.`
      },
      location: {
        required: `Location is <strong>required</strong>.`,
        minlength: `Location must be ${this.textMin} characters or more.`,
        maxlength: `Location must be ${this.locMax} characters or less.`
      }, 
      stadium: {
      }, 
      ownerName: {
        required: `Owner name is <strong>required</strong>.`
      }, 
      owners: {
        minLengthArray: 'Must have at least one owner.', 
        
      }
    };
  }
  
  minLengthArray(min: number) {
    return (c: AbstractControl): {[key: string]: any} => {
        if (c.value.length >= min)
            return null;

        return { 'minLengthArray': {valid: false }};
    }
}

}