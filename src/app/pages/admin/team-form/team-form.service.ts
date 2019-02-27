// src/app/pages/admin/team-form/team-form.service.ts
import { Injectable } from '@angular/core';

@Injectable()
export class TeamFormService {
  validationMessages: any;
  // Set up errors object
  formErrors = {
    nickname: '',
    location: '',
    stadium: ''
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
      owner: {
        required: `Owner is <strong>required</strong>.`
      }
    };
  }

}