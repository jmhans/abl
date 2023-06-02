import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './../../../core/api.service';


interface mlbSchedule {
  totalGames: number;
  dates: [{games: any[], date: string; totalGames: number}]
}


@Component({
  selector: 'app-mlb',
  templateUrl: './mlb.component.html',
  styleUrls: ['./mlb.component.scss']
})
export class MlbComponent implements OnInit {

   games$: Observable<mlbSchedule>
  
  constructor(    private api: ApiService ) { }

  ngOnInit(): void {
    
    this.games$ = this.api.getSchedule$('2021-08-26').pipe(share())
  }

}
