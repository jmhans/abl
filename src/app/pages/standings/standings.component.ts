import { Component, OnInit, OnDestroy ,ViewChild,AfterViewInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../core/api.service';
import { UtilsService } from './../../core/utils.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatSortModule, MatSort, SortDirection, Sort} from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table'



import {Subscription, merge, Observable, of as observableOf, combineLatest, BehaviorSubject} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';



@Component({
  selector: 'app-standings',
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.scss']
})
export class StandingsComponent implements OnInit, OnDestroy {

 pageTitle = 'Standings';
  //standingsSub: Subscription;
  //standings: any[];
  sortedStandings: MatTableDataSource<any[]>; 
  
  //loading: boolean;
  error: boolean;
  sortEvent$: BehaviorSubject<any> = new BehaviorSubject({});
  
  standingsData$: Observable<MatTableDataSource<any[]>>;
  headings = ['Team', 'G', 'W', 'L', 'WPct', 'AVG Runs', 'AB', 'H', '2B', '3B', 'HR', 'BB+HBP', 'SF+SAC', 'SB', 'CS', 'Error', 'ERA', 'HR Allowed']
  colHeads = [{'name': 'team', 'title': 'Team', 'map': (itm)=>{return itm.tm.nickname}}, 
              {'name': 'g', 'title': 'G', 'prop': 'g'}, 
              {'name': 'w', 'title': 'W', 'prop': 'w'}, 
              {'name': 'l', 'title': 'L', 'prop': 'l'}, 
              {'name': 'wpct', 'title': 'Win Pct', 'map': (itm)=>{return itm.w / itm.g}, 'pipe': {'number':'1.3-3'}}, 
              {'name': 'gb'}, 
              {'name': 'l10'},
              {'name': 'streak'},
              {'name': 'abl', 'title': 'ABL Runs', 'prop': 'abl_runs'}, 
              {'name': 'ab', 'title': 'AB', 'prop': 'ab'}, 
              {'name': 'h', 'title': 'H', 'prop': 'h'}, 
              {'name': '2b','title': '2B', 'prop': '2b'}, 
              {'name': '3b','title': '3B', 'prop': '3b'}, 
              {'name': 'hr','title': 'HR', 'prop': 'hr'}, 
              {'name': 'bb','title': 'BB', 'prop': 'bb'}, 
              {'name': 'sac','title': 'SAC', 'prop': 'sac'}, 
              {'name': 'sb','title': 'SB', 'prop': 'sb'},
              {'name': 'cs','title': 'CS', 'prop': 'cs'},
              {'name': 'sb%'},
              {'name': 'e','title': 'Error', 'prop': 'e'},
              {'name': 'bat_avg'},
              {'name': 'slg_pct'},
              {'name': 'era','title': 'ERA', 'prop': 'era'},
              {'name': 'hr_allowed','title': 'HR Allowed', 'prop': 'hr_allowed'}];
  colNames = this.colHeads.map((itm)=> {return itm.name});
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private title: Title,
    public utils: UtilsService,
     public api: ApiService,
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    
  }
  
  ngAfterViewInit() {
    this.standingsData$ = this.sort.sortChange.pipe(
      startWith({}),
      switchMap(()=> {return this.api.getAPIData$('standings')}), 
      map(standings=> {
        
        const topRec = standings.reduce(( best, cur)=> {
          return Math.max(best, cur.w - cur.l)
        }, -Infinity)
        
        const newStandings = standings.map(s=> { 
          s.gb = (topRec - (s.w - s.l)) / 2 
          return s
        })
        
        
        const dataSource = new MatTableDataSource<any[]>();
        dataSource.data = newStandings;
        dataSource.sortingDataAccessor = this.customSort;
        dataSource.sort = this.sort;

        return dataSource
      })
    )
  }
  
  
  customSort(item, header) {
          switch (header) {
            case 'team': return item.tm.nickname;
            case 'wpct': return (item.g > 0) ? item.w / item.g : 0;
            case 'abl': return item.avg_runs;
            case 'bb': return item.bb + item.hbp;
            case 'sac': return item.sac + item.sf;
            case 'sb%': return (item.sb + item.cs > 0 ) ? item.sb / (item.sb + item.cs) : 0;
            case 'bat_avg': return (item.ab > 0 ) ? item.h / item.ab : 0;
            case 'slg_pct': return (item.ab > 0 ) ? ((item.h + item['2b'] + item['3b'] * 2 + item['hr'] * 3) / item.ab) : 0 ;
            default: return item[header];
          }
        }


sortChange(sortEvent: Sort): void {
  console.log(sortEvent);
  this.sortEvent$.next(sortEvent);
  
}


  ngOnDestroy() {

  }
  

}





