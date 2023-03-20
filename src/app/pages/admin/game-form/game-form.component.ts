// src/app/pages/admin/game-form/game-form.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../core/api.service';
import { GameModel, FormGameModel } from './../../../core/models/game.model';
import { AblTeamModel, FormTeamModel } from './../../../core/models/abl.team.model'; 
import { DatePipe } from '@angular/common';
import { dateValidator } from './../../../core/forms/date.validator';
import { DATE_REGEX, TIME_REGEX, stringsToDate } from './../../../core/forms/formUtils.factory';
import { GameFormService } from './game-form.service'; 
import { dateRangeValidator } from './../../../core/forms/date-range.validator';

@Component({
  selector: 'app-game-form',
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.scss'],
  providers: [ GameFormService ]
})
export class GameFormComponent implements OnInit, OnDestroy {
  @Input() game: GameModel;
  isEdit: boolean;
  // FormBuilder form
  gameForm: UntypedFormGroup;
  datesGroup: AbstractControl;
  // Model storing initial form values
  formGame: FormGameModel;
  // Form validation and disabled logic
  formErrors: any;
  formChangeSub: Subscription;
  // Form submission
  submitGameObj: GameModel;
  submitGameSub: Subscription;
  error: boolean;
  submitting: boolean;
  submitBtnText: string;
  
  formTeam: AblTeamModel;
  formTeams: AblTeamModel[];
  formTeamSub: Subscription;
  
  

  constructor(
    private fb: UntypedFormBuilder,
    private api: ApiService,
    private datePipe: DatePipe,
    public gf: GameFormService,
    private router: Router
  ) { }

  ngOnInit() {
    this.formErrors = this.gf.formErrors;
    this.isEdit = !!this.game;
    this.submitBtnText = this.isEdit ? 'Update Game' : 'Create Game';
    // Set initial form data
    this.formGame = this._setFormGame();
    // Use FormBuilder to construct the form
    
    this._getAblTeams();
    this._buildForm();
  }

    
  private _getAblTeams() {

    // Get all owners
    this.formTeamSub = this.api
      .getAblTeams$()
      .subscribe(
        res => {
          this.formTeams = res;
        },
        err => {
          console.error(err);
          this.error = true;
        }
      );
  }
  
  
  
  private _setFormGame() {
    if (!this.isEdit) {
      // If creating a new game, create new
      // FormGameModel with default null data
      return new FormGameModel(null, null, null, null);
    } else {
      // If editing existing game, create new
      // FormGameModel from existing data
      // Transform datetimes:
      // https://angular.io/api/common/DatePipe
      // _shortDate: 1/7/2017
      // 'shortTime': 12:05 PM
      const _shortDate = 'M/d/yyyy';
      return new FormGameModel(
        this.datePipe.transform(this.game.gameDate, _shortDate),
        this.game.awayTeam,
        this.game.homeTeam, 
        this.game.description
      );
    }
  }
  
  
  

  private _buildForm() {
    this.gameForm = this.fb.group({
      homeTeam: [this.formGame.homeTeam, [
        Validators.required
      ]],
      awayTeam: [this.formGame.awayTeam,
        Validators.required
      ],
      description: [this.formGame.description,
        Validators.maxLength(this.gf.descMax)
      ],
      datesGroup: this.fb.group({
        gameDate: [this.formGame.gameDate, [
          Validators.required,
          Validators.maxLength(this.gf.dateMax),
          dateValidator()
        ]]
      })
    });
    // Set local property to gameForm datesGroup control
    this.datesGroup = this.gameForm.get('datesGroup');

    // Subscribe to form value changes
    this.formChangeSub = this.gameForm
      .valueChanges
      .subscribe(data => this._onValueChanged());

    // If edit: mark fields dirty to trigger immediate
    // validation in case editing an game that is no
    // longer valid (for example, an game in the past)
    if (this.isEdit) {
      const _markDirty = group => {
        for (const i in group.controls) {
          if (group.controls.hasOwnProperty(i)) {
            group.controls[i].markAsDirty();
          }
        }
      };
      _markDirty(this.gameForm);
      _markDirty(this.datesGroup);
    }

    this._onValueChanged();
  }

  private _onValueChanged() {
    if (!this.gameForm) { return; }
    const _setErrMsgs = (control: AbstractControl, errorsObj: any, field: string) => {
      if (control && control.dirty && control.invalid) {
        const messages = this.gf.validationMessages[field];
        for (const key in control.errors) {
          if (control.errors.hasOwnProperty(key)) {
            errorsObj[field] += messages[key] + '<br>';
          }
        }
      }
    };

    // Check validation and set errors
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        if (field !== 'datesGroup') {
          // Set errors for fields not inside datesGroup
          // Clear previous error message (if any)
          this.formErrors[field] = '';
          _setErrMsgs(this.gameForm.get(field), this.formErrors, field);
        } else {
          // Set errors for fields inside datesGroup
          const datesGroupErrors = this.formErrors['datesGroup'];
          for (const dateField in datesGroupErrors) {
            if (datesGroupErrors.hasOwnProperty(dateField)) {
              // Clear previous error message (if any)
              datesGroupErrors[dateField] = '';
              _setErrMsgs(this.datesGroup.get(dateField), datesGroupErrors, dateField);
            }
          }
        }
      }
    }
  }

  private _getSubmitObj() {
    const gameDate = this.datesGroup.get('gameDate').value;
    // Convert form startDate/startTime and endDate/endTime
    // to JS dates and populate a new GameModel for submission
    
    // Ensure game time is noon central. 
    
    const insertGameDate = new Date(gameDate).toISOString().substring(0, 10) + "T17:00:00Z"
    
    
    return new GameModel(
      insertGameDate,
      this.gameForm.get('awayTeam').value, // Need to think about these - probably need to extract _id from these differently.  
      this.gameForm.get('homeTeam').value,
      this.gameForm.get('description').value,
      this.game ? this.game._id : null
    );
  }

  onSubmit() {
    this.submitting = true;
    this.submitGameObj = this._getSubmitObj();

    if (!this.isEdit) {
      this.submitGameSub = this.api
        .postGame$(this.submitGameObj)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
    } else {
      this.submitGameSub = this.api
        .editGame$(this.game._id, this.submitGameObj)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
    }
  }

  private _handleSubmitSuccess(res) {
    this.error = false;
    this.submitting = false;
    // Redirect to game detail
    this.router.navigate(['/game', res._id]);
  }

  private _handleSubmitError(err) {
    console.error(err);
    this.submitting = false;
    this.error = true;
  }

  resetForm() {
    this.gameForm.reset();
  }

  ngOnDestroy() {
    if (this.submitGameSub) {
      this.submitGameSub.unsubscribe();
    }
    this.formChangeSub.unsubscribe();
  }

}