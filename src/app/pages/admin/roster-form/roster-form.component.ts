// src/app/pages/admin/team-form/team-form.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../core/api.service';
import { RosterService } from './../../../core/services/roster.service';
import { AblTeamModel, FormTeamModel } from './../../../core/models/abl.team.model'; 
import { DatePipe } from '@angular/common';
import { dateValidator } from './../../../core/forms/date.validator';
import { DATE_REGEX, TIME_REGEX, stringsToDate } from './../../../core/forms/formUtils.factory';
import { RosterFormService } from './roster-form.service';
import { dateRangeValidator } from './../../../core/forms/date-range.validator';
import { MlbPlayerModel } from './../../../core/models/mlb.player.model';
import { RosterRecordModel, CreateRosterRecordModel } from './../../../core/models/roster.record.model';



@Component({
  selector: 'app-roster-form',
  templateUrl: './roster-form.component.html',
  styleUrls: ['./roster-form.component.scss'],
  providers: [ RosterFormService ]
})
export class RosterFormComponent implements OnInit, OnDestroy {
  @Input() player: MlbPlayerModel;
  isEdit: boolean;
  // FormBuilder form
  playerForm: UntypedFormGroup;
  // Model storing initial form values
  formRosterRec: CreateRosterRecordModel;
  formTeam: AblTeamModel;
  formTeams: AblTeamModel[];
  formTeamSub: Subscription;
  formOwnerSub: Subscription; 
  ablTeam: AblTeamModel;
  // Form validation and disabled logic
  formErrors: any;
  formChangeSub: Subscription;
  // Form submission
  submitRosterRec: CreateRosterRecordModel;
  submitRosterSub: Subscription;
  error: boolean;
  submitting: boolean;
  submitBtnText: string;

  constructor(
    private fb: UntypedFormBuilder,
    private api: ApiService,
    private datePipe: DatePipe,
    public rf: RosterFormService,
    private router: Router, 
    private rosterService: RosterService
  ) { }

  ngOnInit() {
    this.formErrors = this.rf.formErrors;
    this.isEdit = !!this.player;
    this.submitBtnText = this.isEdit ? 'Add Player' : 'Create Team';
    // Set initial form data
    this.formRosterRec = this._setFormRosterRec();
    /*this.formPossibleOwners = */this._getTeams();
    // Use FormBuilder to construct the form
    this._buildForm();
  }

  private _setFormRosterRec() {
    if (!this.isEdit) {
      // If creating a new team, create new
      // FormTeamModel with default null data
      
      // THIS SHOULD ALWAYS BE TRUE...
      return new CreateRosterRecordModel(this.player._id, null); // Check the number of data elements in FormTeamModel...
    } else {
      // If editing existing team, create new
      // FormTeamModel from existing data
      return new CreateRosterRecordModel(
        this.player._id,
        null
      );
    }
  }
  
  
  private _getTeams() {

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


  private _buildForm() {
    this.playerForm = this.fb.group({
      ablteam: [this.ablTeam] 
      })
    // Subscribe to form value changes
    this.formChangeSub = this.playerForm
      .valueChanges
      .subscribe(data => this._onValueChanged());

    // If edit: mark fields dirty to trigger immediate
    // validation in case editing an event that is no
    // longer valid (for example, an event in the past)
    if (this.isEdit) {
      const _markDirty = group => {
        for (const i in group.controls) {
          if (group.controls.hasOwnProperty(i)) {
            group.controls[i].markAsDirty();
          }
        }
      };
      _markDirty(this.playerForm);
    }

    this._onValueChanged();
  }

  private _onValueChanged() {
    if (!this.playerForm) { return; }
    const _setErrMsgs = (control: AbstractControl, errorsObj: any, field: string) => {
      if (control && control.dirty && control.invalid) {
        const messages = this.rf.validationMessages[field];
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
          // Clear previous error message (if any)
          this.formErrors[field] = '';
          _setErrMsgs(this.playerForm.get(field), this.formErrors, field);
        
      }
    }
  }

  private _getSubmitObj() {

    // Convert form startDate/startTime and endDate/endTime
    // to JS dates and populate a new EventModel for submission
    return new CreateRosterRecordModel(
      this.player,
      this.playerForm.get('ablteam').value._id
    );
    
//     return new RosterRecordModel(
//       this.player, 
//       this.player.position, 
//       100,
//       this.playerForm.get("ablteam").value, 
//       new Date(), 
//       true
//     )
  }

  onSubmit() {
    this.submitting = true;
    this.submitRosterRec = this._getSubmitObj();

      this.submitRosterSub = this.rosterService
        .addPlayertoTeam$({player: this.submitRosterRec.player}, this.submitRosterRec.ablTeamId)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
  }

  private _handleSubmitSuccess(res) {
    this.error = false;
    this.submitting = false;
    // Redirect to event detail
    this.router.navigate(['/team', res.ablTeam]);
  }

  private _handleSubmitError(err) {
    console.error(err);
    this.submitting = false;
    this.error = true;
  }

  resetForm() {
    this.playerForm.reset();
  }

  ngOnDestroy() {
    if (this.submitRosterSub) {
      this.submitRosterSub.unsubscribe();
    }
    this.formChangeSub.unsubscribe();
  }

}
