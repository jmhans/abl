import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from './../../core/api.service';
import {Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-playoffs',
  templateUrl: './playoffs.component.html',
  styleUrls: ['./playoffs.component.scss']
})
export class PlayoffsComponent implements OnInit, AfterViewInit {
config: any= {status: 'projected', matchups: [{mid: 1, ranks:[1,4],teams: [], rd: 1}, {mid: 2, ranks:[2,3],teams:[], rd: 1}]}

std$:Observable<any>;
  constructor(public api: ApiService ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.std$ = this.api.getAPIData$('standings').pipe(map(resp => {
      resp.sort((a,b)=> {
        a.wpct = a.w/(a.w+a.l+a.t)
        b.wpct =b.w/(b.w+b.l+b.t)
        return a.wpct - b.wpct

      })
      return resp;
    }
      ),
      switchMap((x:any[])=> {
        this.config.matchups.forEach(m=> {
          m.ranks.forEach((r:number)=> {
            let rnk= r-1;
            m.teams.push(x[rnk])
          })
        })
        return observableOf(this.config)

      })
      )}

}
