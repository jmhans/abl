import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RosterFormService {
 validationMessages: any;
  // Set up errors object
  formErrors = {
    ablteam: '',
  };
  // Min/maxlength validation
  
  constructor() {
    this.validationMessages = {
      ablteam: {
        required: `Abl Team is <strong>required</strong>.`
      }
    };
  }
}