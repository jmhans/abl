
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../../auth/auth.service';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventModel } from './../../../core/models/event.model';
import { MlbPlayerModel } from './../../../core/models/mlb.player.model';

@Component({
  selector: 'app-manage-rosters',
  templateUrl: './manage-rosters.component.html',
  styleUrls: ['./manage-rosters.component.scss']
})
export class ManageRostersComponent implements OnInit, OnDestroy {

 pageTitle = 'Add player to roster';
  routeSub: Subscription;
  playerSub: Subscription;
  player: MlbPlayerModel;
  loading: boolean;
  error: boolean;
  private _id: string;

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
        this._getEvent();
      });
  }

  private _getEvent() {
    this.loading = true;
    // GET event by ID
    this.playerSub = this.api
      .getPlayerById$(this._id)
      .subscribe(
        res => {
          this.player = res;
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
    this.playerSub.unsubscribe();
  }


}

