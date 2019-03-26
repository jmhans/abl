// src/app/pages/admin/update-event/update-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../../auth/auth.service';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AblTeamModel, OwnerInterface} from './../../../core/models/abl.team.model';

@Component({
  selector: 'app-update-team',
  templateUrl: './update-team.component.html',
  styleUrls: ['./update-team.component.scss']
})
export class UpdateTeamComponent implements OnInit, OnDestroy {

 pageTitle = 'Update Team';
  routeSub: Subscription;
  teamSub: Subscription;
  team: AblTeamModel;
  activeOwner: OwnerInterface;
  loading: boolean;
  error: boolean;
  private _id: string;
  private _ownerId: string;
  
  tabSub: Subscription;
  tab: string;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private api: ApiService,
    public utils: UtilsService,
    private title: Title
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);

    // Set event ID from route params and subscribe
    this.routeSub = this.route.params
      .subscribe(params => {
        this._id = params['id'];
        this._ownerId = params['ownerId'];
        this._getAblTeam();
        
      });
        // Subscribe to query params to watch for tab changes
    this.tabSub = this.route.queryParams
      .subscribe(queryParams => {
        this.tab = queryParams['tab'] || 'edit';
      });
  }

  private _getAblTeam() {
    this.loading = true;
    // GET team by ID
    this.teamSub = this.api
      .getAblTeamById$(this._id)
      .subscribe(
        res => {
          this.team = res;
          if (this._ownerId) {
            this.activeOwner = this.team.owners.find((owner) => {return (owner._id == this._ownerId)});
          }
          this.loading = false;
        },
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
      );
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
    this.teamSub.unsubscribe();
    this.tabSub.unsubscribe();
  }

}
