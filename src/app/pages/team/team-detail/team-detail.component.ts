import { Component, Input } from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import { UtilsService } from './../../../core/utils.service';
import { AblTeamModel } from './../../../core/models/abl.team.model';

@Component({
  selector: 'app-team-detail',
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss']
})
export class TeamDetailComponent {
  @Input() team: AblTeamModel;

  constructor(
    public utils: UtilsService,
    public auth: AuthService
  ) { }

}