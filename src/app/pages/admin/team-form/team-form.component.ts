// src/app/pages/admin/team-form/team-form.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../core/api.service';
import { AblTeamModel, FormTeamModel } from './../../../core/models/abl.team.model';
import { OwnerModel } from './../../../core/models/owner.model';
import { DatePipe } from '@angular/common';
import { dateValidator } from './../../../core/forms/date.validator';
import { DATE_REGEX, TIME_REGEX, stringsToDate } from './../../../core/forms/formUtils.factory';
import { TeamFormService } from './team-form.service';
import { dateRangeValidator } from './../../../core/forms/date-range.validator';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  styleUrls: ['./team-form.component.scss'],
  providers: [ TeamFormService ]
})
export class TeamFormComponent implements OnInit, OnDestroy {
  @Input() team: AblTeamModel;
  isEdit: boolean;
  // FormBuilder form
  teamForm: FormGroup;
  // Model storing initial form values
  formTeam: FormTeamModel;
  formOwners: OwnerModel[];
  formOwner: OwnerModel;
  formOwnerSub: Subscription; 
  // Form validation and disabled logic
  formErrors: any;
  formChangeSub: Subscription;
  // Form submission
  submitTeamObj: AblTeamModel;
  submitTeamSub: Subscription;
  error: boolean;
  submitting: boolean;
  submitBtnText: string;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private datePipe: DatePipe,
    public tf: TeamFormService,
    private router: Router
  ) { }

  ngOnInit() {
    this.formErrors = this.tf.formErrors;
    this.isEdit = !!this.team;
    this.submitBtnText = this.isEdit ? 'Update Team' : 'Create Team';
    // Set initial form data
    this.formTeam = this._setFormTeam();
    /*this.formPossibleOwners = */this._getOwners();
    // Use FormBuilder to construct the form
    this._buildForm();
  }

  private _setFormTeam() {
    if (!this.isEdit) {
      // If creating a new team, create new
      // FormTeamModel with default null data
      return new FormTeamModel(null, null, null, null); // Check the number of data elements in FormTeamModel...
    } else {
      // If editing existing team, create new
      // FormTeamModel from existing data
      return new FormTeamModel(
        this.team.nickname,
        this.team.location, 
        this.team.stadium, 
        this.team.owner
      );
    }
  }
  
  
  private _getOwners() {

    // Get all owners
    this.formOwnerSub = this.api
      .getOwners$()
      .subscribe(
        res => {
          this.formOwners = res;
        },
        err => {
          console.error(err);
          this.error = true;
        }
      );
  }


  private _buildForm() {
    this.teamForm = this.fb.group({
      nickname: [this.formTeam.nickname, [
        Validators.required,
        Validators.minLength(this.tf.textMin),
        Validators.maxLength(this.tf.nicknameMax)
      ]],
      location: [this.formTeam.location, [
        Validators.required,
        Validators.minLength(this.tf.textMin),
        Validators.maxLength(this.tf.locMax)
      ]], 
      stadium: [this.formTeam.stadium], 
      owner: [this.formTeam.owner]
      })
    // Subscribe to form value changes
    this.formChangeSub = this.teamForm
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
      _markDirty(this.teamForm);
    }

    this._onValueChanged();
  }

  private _onValueChanged() {
    if (!this.teamForm) { return; }
    const _setErrMsgs = (control: AbstractControl, errorsObj: any, field: string) => {
      if (control && control.dirty && control.invalid) {
        const messages = this.tf.validationMessages[field];
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
          _setErrMsgs(this.teamForm.get(field), this.formErrors, field);
        
      }
    }
  }

  private _getSubmitObj() {

    // Convert form startDate/startTime and endDate/endTime
    // to JS dates and populate a new EventModel for submission
    return new AblTeamModel(
      this.teamForm.get('nickname').value,
      this.teamForm.get('location').value,
      this.teamForm.get('stadium').value,
      this.teamForm.get('owner').value,
      this.team ? this.team._id : null
    );
  }

  onSubmit() {
    this.submitting = true;
    this.submitTeamObj = this._getSubmitObj();

    if (!this.isEdit) {
      this.submitTeamSub = this.api
        .postTeam$(this.submitTeamObj)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
    } else {
      this.submitTeamSub = this.api
        .editTeam$(this.team._id, this.submitTeamObj)
        .subscribe(
          data => this._handleSubmitSuccess(data),
          err => this._handleSubmitError(err)
        );
    }
  }

  private _handleSubmitSuccess(res) {
    this.error = false;
    this.submitting = false;
    // Redirect to event detail
    this.router.navigate(['/team', res._id]);
  }

  private _handleSubmitError(err) {
    console.error(err);
    this.submitting = false;
    this.error = true;
  }

  resetForm() {
    this.teamForm.reset();
  }

  ngOnDestroy() {
    if (this.submitTeamSub) {
      this.submitTeamSub.unsubscribe();
    }
    this.formChangeSub.unsubscribe();
  }

}