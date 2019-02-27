// src/app/pages/admin/delete-team/delete-team.component.ts
import { Component, OnDestroy, Input } from '@angular/core';
import { AblTeamModel } from './../../../core/models/abl.team.model';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../core/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delete-team',
  templateUrl: './delete-team.component.html',
  styleUrls: ['./delete-team.component.scss']
})
export class DeleteTeamComponent implements OnDestroy {
  @Input() team: AblTeamModel;
  confirmDelete: string;
  deleteSub: Subscription;
  submitting: boolean;
  error: boolean;

  constructor(
    private api: ApiService,
    private router: Router
  ) { }

  removeTeam() {
    this.submitting = true;
    // DELETE event by ID
    this.deleteSub = this.api
      .deleteTeam$(this.team._id)
      .subscribe(
        res => {
          this.submitting = false;
          this.error = false;
          console.log(res.message);
          // If successfully deleted event, redirect to Admin
          this.router.navigate(['/abladmin']);
        },
        err => {
          console.error(err);
          this.submitting = false;
          this.error = true;
        }
      );
  }

  ngOnDestroy() {
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
    }
  }

}