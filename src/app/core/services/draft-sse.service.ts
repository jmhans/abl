import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject,throwError as ObservableThrowError, of , Subject, Subscription, combineLatestWith, combineLatestAll} from "rxjs";
import { catchError, switchMap, map, tap, startWith, takeUntil, filter, combineLatest} from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../../auth/auth.service';
import { ApiService } from './../api.service';
import { RosterService } from './roster.service';
import { ObserversModule } from "@angular/cdk/observers";
import { SseService } from "./sse.service";

function isEven(n) {
  return n % 2 == 0;
}

function isOdd(n) {
  return Math.abs(n % 2) == 1;
}


@Injectable({
  providedIn: 'root'
})
export class DraftSseService {
  //private base_api= '/api2/'
  draftResults$: Observable<any[]>;
  draftData$: BehaviorSubject<any> = new BehaviorSubject([]);
  playerData$: BehaviorSubject<any> = new BehaviorSubject([]);
  draftOrder=[
    {"_id":"5ca28dbed79ef30033562385","nickname":"Machines","pickOrder":"1"},
    {"_id":"5cb0a459b3a023003331261f","nickname":"Psychos","pickOrder":"2"},
    {"_id":"5cb0a403b3a0230033312618","nickname":"Vipers","pickOrder":"3"},
    {"_id":"5cb0a3a4b3a0230033312614","nickname":"Campers","pickOrder":"4"},
    {"_id":"5cb0a443b3a023003331261d","nickname":"Cracks","pickOrder":"5"},
    {"_id":"5cb0a41fb3a023003331261a","nickname":"Winers","pickOrder":"6"},
    {"_id":"6057711a0049fc1c60942e9d","nickname":"Iguanas","pickOrder":"7"},
    {"_id":"5cb0a473b3a0230033312621","nickname":"Sferics","pickOrder":"8"},
    {"_id":"5cb0a490b3a0230033312623","nickname":"Rats","pickOrder":"9"},
    {"_id":"6237c905f0008a002ecab341","nickname":"Heifers","pickOrder":"10"},

  ]

  draftOrder$: BehaviorSubject<any> = new BehaviorSubject([]);
  //private eventSource: EventSource =new EventSource(`${this.base_api}sse`)
  private draftData: any[];


  unsubscribe$: Subject<void> = new Subject<void>();

 // draftSub : Subscription;

  constructor(
    private _zone: NgZone,
    private http: HttpClient,
    private auth: AuthService,
    private api:ApiService,
    private rosterService: RosterService,
    private SseService: SseService,

    ) {
      //this.notify();
      if (true) {
        this.suppDraft_new()
      } else {
        this.regularDraftOrder()
      }


      this.rosterService.refreshLineups();
      this.SseService.getSSE$('rosters').subscribe((data)=> {this.rosterService.refreshLineups()});
      this.SseService.getSSE$('skips').subscribe((data)=> {this.rosterService.refreshSkips()});
      this.SseService.getSSE$('draft').subscribe((data)=> {this.rosterService.refreshLineups()});


    }

    regularDraftOrder() {

      let onePickDraftRounds = 18 // This must be an even number the way things are currently set up.
      let multiPickDraftRounds = 2 // This is used for totalPicks, but isn't fully incorporated in actual picks below. Logic below just assumes 2 multipick rounds at the end.
      let picksPerMultiRound = 3
      let totalPicks = onePickDraftRounds + multiPickDraftRounds * picksPerMultiRound
      of(this.draftOrder).pipe(
        takeUntil(this.unsubscribe$),
        combineLatestWith(this.rosterService.activeRosters$),
        map(([standings, rosters])=> { return standings.map(s=> {
            let rstr =rosters.find((r)=> r.ablTeam == s._id) //|| []
            return {...s, roster: rstr }
        })}),
      map((data) => {
        return data.map((team)=> {
          let origRoster = team.roster?.roster.filter((p)=> p.player.ablstatus.acqType == 'draft') || [];
          return {...team, picks_allowed: totalPicks-origRoster?.length, origRoster: origRoster }

        })
      }),
      map((data:any[])=> {
        let draftRounds = []

        for (let i=0; i<onePickDraftRounds; i=i+2) {
          draftRounds[i]= {rowrev: false, data: data.map(tm=> {

            return {team: tm.nickname, pick: tm.origRoster[i], allowed: i+1 <= (totalPicks - (tm.roster?.roster.length || 0))}
          })}
          draftRounds[i+1] = {rowrev: true, data: [...data].reverse().map(tm=> {
            return {team: tm.nickname, pick: tm.origRoster[i+1], allowed: i+1+1 <= (totalPicks - (tm.roster?.roster.length || 0))}
          })}
        }
          let newi = onePickDraftRounds
          for (let sub_i=0; sub_i<picksPerMultiRound; sub_i++) {
            draftRounds[newi+sub_i]= {rowrev: false, data: data.map(tm=> {
              return {team: tm.nickname, pick: tm.origRoster[newi+sub_i], allowed: newi+sub_i+1 <= (totalPicks - (tm.roster?.roster.length || 0))}
            })}
            draftRounds[newi+sub_i+picksPerMultiRound] = {rowrev: true, data: [...data].reverse().map(tm=> {
              return {team: tm.nickname, pick: tm.origRoster[newi+sub_i+picksPerMultiRound], allowed: newi+sub_i+picksPerMultiRound <= (totalPicks - (tm.roster?.roster.length || 0))}
            })}

        }



        let pick, currentPick;
        let pickRd = 0;
        let pickRow = 0;
        let tm = 0
        do {
          pick = draftRounds[pickRd].data[tm].pick
          currentPick = {row: pickRd, column: tm, vis_team: draftRounds[pickRd].data[tm].team }// data.findIndex((item)=> {return item.nickname == draftRounds[pickRd].data[tm].team})}
          if (pickRd < onePickDraftRounds) {

            tm = (tm+1) % data.length
            if (tm == 0) {
              pickRd++
            }
          } else {
            pickRd++
            if (((pickRd - onePickDraftRounds) % picksPerMultiRound) == 0) {
              tm = (tm+1) % data.length
              if (tm != 0) {
                pickRd = pickRd - picksPerMultiRound

              }
            }
          }
        } while (pick && (pickRd < onePickDraftRounds + picksPerMultiRound * multiPickDraftRounds))
        let maxRosterLength = data.reduce((acc, cur)=> {
          return Math.max(acc, cur.origRoster.length)
        }, 0
        )
        return {currentPick: currentPick, rosters: data, rounds: draftRounds, activeRounds : maxRosterLength}
      })

      ).subscribe(data => {
          console.log(data)
        this.draftOrder$.next(data)
      })

    }


    suppDraft_new() {
      this.rosterService.draftList$.pipe(
        takeUntil(this.unsubscribe$),
        map((data:any[])=> {
          var currPickNumber = data.filter((dp)=> {return dp.status == 'Pending'}).reduce((acc, cur)=> {
            return Math.min(acc, cur.pickNumber)
          }, 999)

          let newData =data.map((dp)=> {
            if (dp.pickNumber == currPickNumber) {
              return {...dp,status:'Current'}
            }
            return dp
          })


        var groupByArr = function(xs, key) {
          return xs.reduce(function(rv, x) {
            (rv[x[key]-1] ??= []).push(x);
            return rv;
          }, []);
        }

        let grouped = groupByArr(newData, "round")
        let teams = grouped[0]

        return {currentPick: newData.find((pick)=>{return pick.status == 'Current'}),  rounds: grouped, teams :teams }
      })

      ).subscribe(data => {
        console.log(data)
      this.draftOrder$.next(data)
    })

    }


    suppDraftDraftOrder2() {
      let onePickDraftRounds = 5
      let multiPickDraftRounds = 0
      let picksPerMultiRound = 0
      let totalPicks = 27

      this.api.getStandings$('2025-06-03').pipe(
        takeUntil(this.unsubscribe$),

        map((data:any[]) => {

          data.sort((a,b)=> {
            let wpct = (o)=> {return o.w/o.g}
            if (wpct(a) == wpct(b)) {
              return a.avg_runs - b.avg_runs
            }

            return (a.w / a.g) - (b.w / b.g)})

          let newData = data.map((d)=> {
            const {tm, ...otherProps} = d
            return tm
          })

          return newData
        }),
        combineLatestWith(this.rosterService.activeRosters$),
        map(([standings, rosters])=> { return standings.map(s=> {
            let rstr =rosters.find((r)=> r.ablTeam == s._id) //|| []
            return {...s, roster: rstr }
        })}),
        // This came from Regular Draft order
        combineLatestWith(this.rosterService.skipList$),
        combineLatestWith(this.rosterService.draftList$),
        map(([[data, skips], draftList]) => {
          return data.map((team)=> {
            //let supp_draft_picks = team.roster?.roster.filter((p)=> p.player.ablstatus.acqType != 'draft');
            let supp_draft_picks= draftList.filter((p)=> (typeof p.ablTeam == 'string' ? (p.ablTeam == team._id) : (p.ablTeam._id == team._id)) );
            let origRoster = team.roster?.roster.filter((p)=> p.player.ablstatus.acqType == 'draft');
            supp_draft_picks = [...supp_draft_picks, ...skips.filter((s)=> s.ablTeam == team._id).map((item)=> {
              return  {type: "Skip", _id: item._id, player: {name: "skip", team: null, eligible:[]}}
            })]
            return {...team, supp_draft_picks: supp_draft_picks, orig_roster: origRoster, picks_allowed: totalPicks-origRoster?.length }

          })
        }),
        map((data) => {
        return data.map((team)=> {
          let origRoster = team.roster?.roster.filter((p)=> p.player.ablstatus.acqType == 'draft') || [];
          return {...team, picks_allowed: totalPicks-origRoster?.length, origRoster: origRoster }

        })
      }),
      map((data:any[])=> {
        let draftRounds = []



        for (let i=0; i<onePickDraftRounds; i=i+1) {
          draftRounds[i]= {rowrev: false, data: data.map(tm=> {
            const { nickname, _id } = tm;

            return {team: { nickname, _id }, pick: tm.supp_draft_picks[i], allowed: i+1 <= (totalPicks - (tm.origRoster.length || 0))}
          })}
        }
          let newi = onePickDraftRounds
          for (let sub_i=0; sub_i<picksPerMultiRound; sub_i++) {
            draftRounds[newi+sub_i]= {rowrev: false, data: data.map(tm=> {
              const { nickname, _id }= tm;
              return {team: { nickname, _id }, pick: tm.supp_draft_picks[newi+sub_i], allowed: newi+sub_i+1 <= (totalPicks - (tm.origRoster.length || 0))}
            })}
            draftRounds[newi+sub_i+picksPerMultiRound] = {rowrev: true, data: [...data].reverse().map(tm=> {
              const { nickname, _id }= tm;
              return {team: { nickname, _id }, pick: tm.supp_draft_picks[newi+sub_i+picksPerMultiRound], allowed: newi+sub_i+picksPerMultiRound <= (totalPicks - (tm.origRoster.length || 0))}
            })}

        }



        let pick, currentPick;
        let pickRd = 0;
        let pickRow = 0;
        let tm = 0
        do {
          pick = draftRounds[pickRd].data[tm].pick
          currentPick = {row: pickRd, column: tm, vis_team: draftRounds[pickRd].data[tm].team.nickname }// data.findIndex((item)=> {return item.nickname == draftRounds[pickRd].data[tm].team})}
          if (pickRd < onePickDraftRounds) {

            tm = (tm+1) % data.length
            if (tm == 0) {
              pickRd++
            }
          } else {
            pickRd++
            if (((pickRd - onePickDraftRounds) % picksPerMultiRound) == 0) {
              tm = (tm+1) % data.length
              if (tm != 0) {
                pickRd = pickRd - picksPerMultiRound

              }
            }
          }
        } while (pick && (pickRd < onePickDraftRounds + picksPerMultiRound * multiPickDraftRounds))
        let maxRosterLength = data.reduce((acc, cur)=> {
          return Math.max(acc, cur.origRoster.length)
        }, 0
        )
        return {currentPick: currentPick, rosters: data, rounds: draftRounds, activeRounds : maxRosterLength}
      })

      ).subscribe(data => {
          console.log(data)
        this.draftOrder$.next(data)
      })

    }



  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
