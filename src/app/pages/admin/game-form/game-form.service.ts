// src/app/pages/admin/game-form/game-form.service.ts
import { Injectable } from '@angular/core';

@Injectable()
export class GameFormService {
  validationMessages: any;
  // Set up errors object
  formErrors = {
    awayTeam: '',
    homeTeam: '',
    description: '',
    datesGroup: {
      gameDate: ''
    }
  };
  // Min/maxlength validation
  textMin = 3;
  titleMax = 36;
  locMax = 200;
  dateMax = 10;
  timeMax = 8;
  descMax = 2000;
  // Formats
  dateFormat = 'm/d/yyyy';
  timeFormat = 'h:mm AM/PM';

  constructor() {
    this.validationMessages = {
      awayTeam: {
        required: `Away Team is <strong>required</strong>.`
      },
      homeTeam: {
        required: `Home Team is <strong>required</strong>.`
      },
      gameDate: {
        required: `Start date is <strong>required</strong>.`,
        date: `Game date must be a <strong>valid date</strong> at least one day <strong>in the future</strong>.`
      },
      description: {
        maxlength: `Description must be ${this.descMax} characters or less.`
      }
    };
  }

}