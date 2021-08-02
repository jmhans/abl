
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../../auth/auth.service';
import { ApiService } from './../../../core/api.service';
import { Subscription, Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { UtilsService } from './../../../core/utils.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-manage-games',
  templateUrl: './manage-games.component.html',
  styleUrls: ['./manage-games.component.scss']
})
export class ManageGamesComponent implements OnInit {

   pageTitle = 'Find Old Game Format';
  oldGames$: Observable<any[]>
  resp: Subscription;
  
  constructor(    
    private route: ActivatedRoute,
    public auth: AuthService,
    public api: ApiService,
    public utils: UtilsService,
    private title: Title
                  ) { }

  ngOnInit(): void {
    
        this.title.setTitle(this.pageTitle);
        this.oldGames$ = this.api.oldGames$().pipe(share());


  }
  
  _addIds(gmId) {
      this.resp =  this.api.fixoldGame$(gmId).subscribe(
        res => {
          console.log(res)
        },
        err => {
          console.error(err);
        }
      )
  }


}
