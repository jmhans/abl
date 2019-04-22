// src/app/pages/admin/admin.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './../../../auth/auth.service';
import { ApiService } from './../../../core/api.service';
import { UtilsService } from './../../../core/utils.service';
import { FilterSortService } from './../../../core/filter-sort.service';
import { Subscription } from 'rxjs';
import { MlbGameModel } from './../../../core/models/mlbgame.model';
import { GameModel } from './../../../core/models/game.model';

@Component({
  selector: 'app-abl-admin',
  templateUrl: './abl-admin.component.html',
  styleUrls: ['./abl-admin.component.scss']
})
export class AblAdminComponent implements OnInit, OnDestroy {
  pageTitle = 'ABL Admin';
  saveSub: Subscription;
  dataSub: Subscription;
  dataList: any[] = [];
  filteredGames: any[];
  loading: boolean;
  error: boolean;
  query = '';
  datafile: string = '';
  dataEntry:string = '';
  dataTypes: string[] = ['games', 'lineups'];
  selectedDataType: string;

  constructor(
    private title: Title,
    public auth: AuthService,
    private api: ApiService,
    public utils: UtilsService,
    public fs: FilterSortService
  ) { }

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    //this._getDataFiles();
  }

  private _loadData() {
    this.loading = true;
    this.dataSub = this.api
      .getData$(this.datafile)
      .subscribe(
        res => {
          this.dataList = res;
          this.filteredGames = res;
          this.loading = false;
        }, 
      err => {
        console.log(err);
        this.loading = false;
        this.error = true;
      }
      )
  }
  
  private _createRec() {
    
    var obj = JSON.parse(this.dataEntry)
    
    console.log(obj);
    if (Array.isArray(obj)) {
      obj.forEach((objRec) => {this.dataList.push(objRec)})
    } else {
      this.dataList.push(obj);
    }
    console.log(this.dataList);
    this.resetQuery();
    this.loading = false;
  }
  
  private _saveRecToDB(rec) {
    this.saveSub = this.api
      .postData$(this.selectedDataType, rec)
      .subscribe(
        res => {
          rec.saved = true
          console.log(res)
        },
        err => {
          console.error(err);
        }
    )
  }
  
  private _getDataFiles() {
    this.loading = true;
    this.dataSub = this.api
      .getData$('gamesList')
      .subscribe(
        res => {
          this.dataList = res;
          this.filteredGames = res;
          this.loading = false
        }, 
        err => {
          console.error(err);
          this.loading = false;
          this.error = true;
        }
     );
  }
  
  private _uploadAllData() {
    // use the generic postData api call...
    
    
    this.dataList.forEach((data) => {
      
//      const newGm = new GameModel(gm.gameDate, {"_id": gm.awayTeam}, {"_id": gm.homeTeam});
      
      this.api
        .postData$(this.selectedDataType, data)
        .subscribe(
          res => {
            console.log(res)
          }, 
          err => {
            console.error(err);
          }
        )
    })
  }
  
  
//   private _getGamesList() {
//     this.loading = true;
//     // Get all (admin) games
//     this.gamesSub = this.api
//       .getAdminGames$()
//       .subscribe(
//         res => {
//           this.gamesList = res;
//           this.filteredGames = res;
//           this.loading = false;
//         },
//         err => {
//           console.error(err);
//           this.loading = false;
//           this.error = true;
//         }
//       );
//   }

  searchGames() {
    this.filteredGames = this.fs.search(this.dataList, this.query, '_id', 'mediumDate');
  }

  resetQuery() {
    this.query = '';
    this.filteredGames = this.dataList;
  }

  ngOnDestroy() {
    if (this.saveSub) { this.saveSub.unsubscribe();}
    if (this.dataSub) { this.dataSub.unsubscribe();}
  }

}
