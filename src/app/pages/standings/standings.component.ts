import { Component, OnInit, OnDestroy ,ViewChild,AfterViewInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from './../../core/api.service';
import { UtilsService } from './../../core/utils.service';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSortModule, MatSort, SortDirection, Sort} from '@angular/material/sort';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table'

import {MatTabChangeEvent} from '@angular/material/tabs'

import {Subscription, merge, Observable, of as observableOf, combineLatest, BehaviorSubject} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import { moveItemInArray } from '@angular/cdk/drag-drop';



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
  standtingstype: string = 'basic';
  //loading: boolean;
  error: boolean;
  sortEvent$: BehaviorSubject<any> = new BehaviorSubject({});

  standingsData$: Observable<MatTableDataSource<any[]>>;
  headings = ['Team', 'G', 'W', 'L', 'WPct', 'AVG Runs', 'AB', 'H', '2B', '3B', 'HR', 'BB+HBP', 'SF+SAC', 'SB', 'CS', 'Error', 'ERA', 'HR Allowed']
  colHeads = [{'name': 'team', 'title': 'Team', 'map': (itm)=>{return itm.tm.nickname}, 'type': ['Standard', 'Advanced']},
              {'name': 'g', 'title': 'G', 'prop': 'g', 'type': ['Standard', 'Advanced']},
              {'name': 'w', 'title': 'W', 'prop': 'w', 'type': ['Standard', 'Advanced']},
              {'name': 'l', 'title': 'L', 'prop': 'l', 'type': ['Standard', 'Advanced']},
              {'name': 'wpct', 'title': 'Win Pct', 'map': (itm)=>{return itm.w / itm.g}, 'pipe': {'number':'1.3-3'}, 'type': ['Standard']},
              {'name': 'gb', 'type': ['Standard']},
              {'name': 'l10', 'type': ['Standard']},
              {'name': 'streak', 'type': ['Standard']},
              {'name': 'abl', 'title': 'ABL Runs', 'prop': 'abl_runs', 'type': ['Standard']},
              {'name': 'ab', 'title': 'AB', 'prop': 'ab', 'type': ['Standard']},
              {'name': 'h', 'title': 'H', 'prop': 'h', 'type': ['Standard']},
              {'name': '2b','title': '2B', 'prop': '2b', 'type': ['Standard']},
              {'name': '3b','title': '3B', 'prop': '3b', 'type': ['Standard']},
              {'name': 'hr','title': 'HR', 'prop': 'hr', 'type': ['Standard']},
              {'name': 'bb','title': 'BB', 'prop': 'bb', 'type': ['Standard']},
              {'name': 'sac','title': 'SAC', 'prop': 'sac', 'type': ['Standard']},
              {'name': 'sb','title': 'SB', 'prop': 'sb', 'type': ['Standard']},
              {'name': 'cs','title': 'CS', 'prop': 'cs', 'type': ['Standard']},
              {'name': 'sb%', 'type': ['Standard']},
              {'name': 'e','title': 'Error', 'prop': 'e', 'type':['Standard']},
              {'name': 'bat_avg', 'type': ['Standard']},
              {'name': 'slg_pct', 'type':['Standard']},
              {'name': 'era','title': 'ERA', 'prop': 'era', 'type': ['Standard']},
              {'name': 'hr_allowed','title': 'HR Allowed', 'prop': 'hr_allowed', 'type':['Standard']},
              {'name': 'dougluckw', 'title': 'DougLuck W', 'type': ['Advanced']},
              {'name': 'dougluckl', 'title': 'DougLuck L', 'type': ['Advanced']},
              {'name': 'dougluckExcessW', 'title': 'Lucky Wins', 'type': ['Advanced']},
              {'name': 'homeRecord', 'title': 'Home Record', 'type': ['Advanced']},
              {'name': 'awayRecord', 'title': 'Away Record', 'type': ['Advanced']},
              {'name': 'xtrasRecord', 'title': 'Extras Record', 'type': ['Advanced']},
            ];

  currTab: string = "Standard"
  colNames: string[] =[]



  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private title: Title,
    public utils: UtilsService,
     public api: ApiService,
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this.refreshColNames();


  }

  public onSelectedTabChange(matTabChangeEvent: MatTabChangeEvent)  {
    console.log(matTabChangeEvent.tab.textLabel);
    this.currTab = matTabChangeEvent.tab.textLabel
    this.refreshColNames();

  }

  refreshColNames() {
    this.colNames = this.colHeads.filter((itm)=> itm.type.indexOf(this.currTab) > -1).map((itm)=> {return itm.name});

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

