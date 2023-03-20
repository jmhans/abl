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
import { LineupFormService } from './lineup-form.service';
import { dateRangeValidator } from './../../../core/forms/date-range.validator';
import { MlbPlayerModel } from './../../../core/models/mlb.player.model';
//import { RosterRecordModel, CreateRosterRecordModel } from './../../../core/models/roster.record.model';
import { LineupModel, LineupFormModel } from './../../../core/models/lineup.model';

@Component({
  selector: 'app-lineup-form',
  templateUrl: './lineup-form.component.html',
  styleUrls: ['./lineup-form.component.scss'],
  providers: [ LineupFormService ]
})
export class LineupFormComponent implements OnInit, OnDestroy {
  @Input() lineup: LineupModel;
  @Input() lineupId: string;
  isEdit: boolean;
  // FormBuilder form
  playerForm: UntypedFormGroup;
  // Model storing initial form values
  formRosterRec: LineupFormModel;
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
    // Use FormBuilder to construct the form
    this._buildForm();
  }

  private _setFormRosterRec() {
    if (!this.isEdit) {
      // If creating a new lineup, create new
      // with default null data
      
      return new LineupFormModel(this.lineupId, null, this.lineup.roster, this.lineup.effectiveDate); 
    } else {
      // If editing existing lineup, create new
      // from existing data
    return new LineupFormModel(this.lineupId, this.lineup._id, this.lineup.roster, this.lineup.effectiveDate); 
  }
  }
  
  
  private _buildForm() {

  }

  private _getSubmitObj() {

    // Convert form startDate/startTime and endDate/endTime
    // to JS dates and populate a new EventModel for submission
    return new CreateSubmitLineupModel(
      this.lineupId,
      this.rosterForm.get("rosterId").value,
      this.rosterForm.get('roster').value,
      this.rosterForm.get('effectiveDate').value
    );

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


