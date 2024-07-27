/*jshint esversion: 8 */

const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();

const AblGame = require('../models/Game').Game;
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
var StatlineController = require('./statline.controller');
const Statline = require('../models/statline').Statline;

const validPositions = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH'] // Would exclude any DL or NA positions from lineups.

const GameResultsView = require('../models/Game').GameResultsView;

const ObjectId = require('mongoose').Types.ObjectId;


  function canPlayPosition(playerPosition, lineupSlot) {
    switch (lineupSlot) {
      case "DH":
      case "XTRA":
        return (validPositions.indexOf(playerPosition) != -1);
      default:
        return (playerPosition == lineupSlot)
    }
  }



class statline {
  constructor(statline) {

    this.plateAppearances = (statline.bb || 0) + (statline.hbp || 0) + (statline.ab || 0 )+ (statline.sac || 0)+ (statline.sf || 0)
  }

}


class lineupArray extends Array {
  active() {
    return this.filter((plyr) => {return (plyr.ablstatus == 'active')})
  }

  regulation() {
    return this.active().filter((plyr) => {return (plyr.playedPosition != 'XTRA')})
  }

  extras() {
    return this.active().filter((plyr) => {return (plyr.playedPosition == 'XTRA')})
  }

  bench() {
    return this.filter((plyr) => { return (plyr.ablstatus != 'active')    })
  }

  benchWithStats() {
    return this.bench().filter((plyr) => {
      return (plyr.dailyStats && plyr.dailyStats.g >0)
    })
  }

  ablscore(homeTeam = false) {
    return this.active().reduce((total, curPlyr) => {
      total.abl_points += (curPlyr.dailyStats.abl_points || 0);
        if (["DH", "XTRA"].includes(curPlyr.playedPosition)  ) {
          // Player played in DH or XTRA spot, so errors are not counted toward team total.
          total.e += (curPlyr.dailyStats.e || 0);
        }


        total.ab += (curPlyr.dailyStats.ab || 0);
        total.abl_runs = total.abl_points / total.ab - 0.5 * total.e - 4.5 + 0.5 * homeTeam;

      return total;

    }, {abl_runs: 0, abl_points: 0, e: 0, ab: 0})
  }

  order() {
    this.sort((a,b)=> {return (a.lineupOrder || Infinity) - (b.lineupOrder || Infinity)})
  }

  regulationScore(homeTeam = false, oppErrors = 0) {
    return this.regulation().reduce((total, curPlyr) => {
      total.abl_points += (curPlyr.dailyStats.abl_points || 0);
        if (!["DH", "XTRA"].includes(curPlyr.playedPosition)  ) {
          // Player played in DH or XTRA spot, so errors are not counted toward team total.
          total.e += (curPlyr.dailyStats.e || 0);
        }

        ["g", "ab", "h", "2b", "3b", "hr", "bb", "hbp", "sac", "sf", "sb", "cs"].forEach((prop) => {
          total[prop] += curPlyr.dailyStats[prop] || 0
        })

        // total.ab += (curPlyr.dailyStats.ab || 0);

        total.abl_runs = total.abl_points / total.ab + 0.5 * oppErrors  - 4.5 + 0.5 * homeTeam;

      return total;

    }, {abl_runs: 0, abl_points: 0, e: 0, ab: 0, g:0, h:0, "2b": 0, "3b":0, hr:0, bb:0, hbp:0, sac:0, sf:0, sb:0, cs:0, opp_e: oppErrors})
  }

  finalScore(homeTeam = false, oppErrors = 0) {
    return this.active().reduce((total, curPlyr) => {
      total.abl_points += (curPlyr.dailyStats.abl_points || 0);
        if (!["DH", "XTRA"].includes(curPlyr.playedPosition)  ) {
          // Player played in DH or XTRA spot, so errors are not counted toward team total.
          total.e += (curPlyr.dailyStats.e || 0);
        }

        ["g", "ab", "h", "2b", "3b", "hr", "bb", "hbp", "sac", "sf", "sb", "cs"].forEach((prop) => {
          total[prop] += curPlyr.dailyStats[prop] || 0
        })

        // total.ab += (curPlyr.dailyStats.ab || 0);

        total.abl_runs = total.abl_points / total.ab + 0.5 * oppErrors  - 4.5 + 0.5 * homeTeam;

      return total;

    }, {abl_runs: 0, abl_points: 0, e: 0, ab: 0, g:0, h:0, "2b": 0, "3b":0, hr:0, bb:0, hbp:0, sac:0, sf:0, sb:0, cs:0, opp_e: oppErrors})
  }
  nextRosterPos() {
    return this.active().reduce((tot, cur)=> {return Math.max(cur.rosterPos, tot)}, 0)+1
  }


  startNextPlayer(pos, rosterPos = 99, starterOnly = false) {

        var posPAs = this.active().filter((p)=> {return p.ablRosterPosition == rosterPos}).reduce((total, cur)=> {return total + (new statline(cur.dailyStats).plateAppearances)}, 0);
        var posGs = this.active().filter((p)=> {return p.ablRosterPosition == rosterPos}).reduce((total, cur)=> {return total + (cur.dailyStats.g || 0)},0 );

        var possibles = this.bench().filter((plyr)=> {
          return canPlayPosition(plyr.lineupPosition, pos)
        });
       var curPlyrRec;

        var playedType = (pos == 'XTRA') ? 'XTRA' : (posGs == 0 ? 'STARTER' : 'SUB')
        while ( starterOnly ? (posGs < 1) :  (posPAs < 2) ) {

          if (possibles.length > 0) {
            var nextPlyr = possibles[0]

            if ( nextPlyr.dailyStats && nextPlyr.dailyStats.g > 0) {

              curPlyrRec = this[this.indexOf(nextPlyr)];


              curPlyrRec.gameStatus = {playedPosition: pos, played: 'active', lineupOrder: this.active().length}
              curPlyrRec.playedPosition = pos
              curPlyrRec.ablstatus = 'active'
              curPlyrRec.ablPlayedType = playedType
              curPlyrRec.ablRosterPosition = rosterPos
              curPlyrRec.lineupOrder = this.active().length
              playedType = 'STARTER' ? 'SUB' : playedType

              posPAs += new statline(curPlyrRec.dailyStats).plateAppearances; //this.plateAppearances(nextPlyr.dailyStats)
              posGs += curPlyrRec.dailyStats.g

            }
            possibles.splice(0, 1); // First player has been evaluated. Remove him from list for next loop.

          } else {
            // Still not enough Plate Appearances. Add in Supplemental.

            if (posGs > 0) {
              this.push({"player": {name: "supp"}, gameStatus: {lineupOrder : this.active().length + 1, playedPosition: pos, played: 'active'},  ablRosterPosition: rosterPos, ablPlayedType: playedType, lineupOrder : this.active().length + 1, playedPosition: pos, ablstatus: 'active', dailyStats: {g: 1, ab: 2 - posPAs, h: 0, e: 0}})
              posPAs = 2
            } else {
              this.push({"player": {name: "four"}, gameStatus: {lineupOrder : this.active().length + 1, playedPosition: pos, played: 'active'},   ablRosterPosition: rosterPos, ablPlayedType: playedType,   lineupOrder : this.active().length + 1, playedPosition: pos, ablstatus: 'active', dailyStats: {g: 1, ab: 4, h: 0, e: 0}})
              posPAs = 4
            }

              posGs += 1

          }

        }

    return this
  }

}

const ABL_STARTERS = ['1B', '2B',  'SS','3B', 'OF', 'OF', 'OF', 'C', 'DH']
function  _updateAttestStatus(attCount) {
  var status = '';
  switch (true) {
    case (attCount >= 2):
      status = 'final';
      break;
    case (attCount == 1):
      status = 'awaiting validation';
      break;
    default:
      status =  'awaiting attestation';
  }
  return status
  }

class ABLGameController extends BaseController{

    constructor() {
      super(AblGame, 'games');
    }

    canPlayPosition(playerPosition, lineupSlot) {
      switch (lineupSlot) {
        case "DH":
        case "XTRA":
          return (playerPosition != 'NA' && playerPosition != 'INJ');
        default:
          return (playerPosition == lineupSlot)
      }
    }

    _getDailyStats(statlineObj) {
      var retObj = {};
      if (typeof(statlineObj.stats) != 'undefined') {
        if (statlineObj.stats.modified) {
           retObj = {
            'mlbId': statlineObj.mlbId,
            'gamePk': statlineObj.gamePk,
            'gameDate': statlineObj.gameDate,
            'g': statlineObj.stats.g,
            'ab': statlineObj.stats.ab,
            'h': statlineObj.stats.h,
            '2b': statlineObj.stats['2b'] ,
            '3b': statlineObj.stats['3b'] ,
            'hr': statlineObj.stats.hr ,
            'bb': statlineObj.stats.bb ,
            'ibb': statlineObj.stats.ibb,
            'hbp': statlineObj.stats.hbp ,
            'sb': statlineObj.stats.sb ,
            'cs': statlineObj.stats.cs ,
            'sac': statlineObj.stats.sac,
            'sf': statlineObj.stats.sf ,
            'e': statlineObj.stats.e ,
            'position(s)': statlineObj.positions

          }
        }
        else {

        retObj = {
          'mlbId': statlineObj.mlbId,
          'gamePk': statlineObj.gamePk,
          'gameDate': statlineObj.gameDate,
          'g':  statlineObj.stats.batting.gamesPlayed,
          'ab':  statlineObj.stats.batting.atBats,
          'h':  statlineObj.stats.batting.hits,
          '2b':  statlineObj.stats.batting.doubles,
          '3b':  statlineObj.stats.batting.triples,
          'hr':  statlineObj.stats.batting.homeRuns,
          'bb':  statlineObj.stats.batting.baseOnBalls,
          'ibb':  statlineObj.stats.batting.intentionalWalks,
          'hbp':  statlineObj.stats.batting.hitByPitch,
          'sb':  statlineObj.stats.batting.stolenBases,
          'cs':  statlineObj.stats.batting.caughtStealing,
          'sac':  statlineObj.stats.batting.sacBunts,
          'sf':  statlineObj.stats.batting.sacFlies,
          'e':  statlineObj.stats.fielding.e,
          'position(s)': statlineObj.positions

        }
        }




      } else {
        retObj = {
          'mlbId': statlineObj.mlbId,
          'gamePk': statlineObj.gamePk,
          'gameDate': statlineObj.gameDate,
          'g': 0,
          'ab': 0,
          'h': 0,
          '2b': 0,
          '3b': 0,
          'hr': 0,
          'bb': 0,
          'ibb': 0,
          'hbp': 0,
          'sb': 0,
          'cs': 0,
          'sac': 0,
          'sf': 0,
          'e': 0,
          'position(s)': []
        }

      }
          var ablPts =
          25 * (retObj.h || 0) +
          10 * (retObj["2b"] || 0)+
          20 * (retObj["3b"] || 0) +
          30 * (retObj.hr || 0) +
          10 * (retObj.bb || 0) +
          //10 * (retObj.ibb || 0)+
          10 * (retObj.hbp || 0) +
          7 * ((retObj.sb || 0) - (retObj.cs || 0)) +
          5 * ((retObj.sac || 0) + (retObj.sf || 0));

       var ablruns = ablPts / retObj.ab - 0.5 * retObj.e - 4.5;
      retObj.abl_points = ablPts;
      retObj.abl_score = ablruns;
      return retObj;
    }

    _saveGameRoster(roster , gameObj, rosterType) {
      switch (rosterType) {
        case "H":
          gameObj.homeTeamRoster = roster;
          break;
        case "A":
          gameObj.awayTeamRoster = roster;
          break;
        default:
          // code block
      }
      gameObj.save(err => {
        if (err) {
          return '';
        }
      })
    }

    async _getByIdBackend(gmId) {
      try {
        var result = await AblGame.aggregate([
            {
              '$match': {
                '_id': new ObjectId(gmId)
              }
            }, {
              '$addFields': {
                'results': {
                  '$cond': {
                    'if': {
                      '$isArray': '$results'
                    },
                    'then': '$results',
                    'else': [
                      '$results'
                    ]
                  }
                }
              }
            }, {
              '$addFields': {
                'results': {
                  '$filter': {
                    'input': '$results',
                    'as': 'res',
                    'cond': {'$ne': ['$$res', null]}
                  }
                }
              }
            }
          ]).exec()


          const populatedGame = await AblGame.populate(result, {path:'awayTeam homeTeam awayTeamRoster.player homeTeamRoster.player' })
          if (populatedGame) {
            return {status: 'success', data: populatedGame[0]}
          } else {
            return {status: 'error', message: 'Game not found'}
          }
      } catch (err) {
        return {status: 'error', message: err}
      }

  }

 async _getById(req, res) {
    try {

      var result = await this._getByIdBackend(req.params.id)
      if (result.status != 'error') {
        res.send(result.data)
      } else {
        res.status(500).send({
          message: result.message
        })
      }
    }
    catch (err) {
      return res.status(500).send({message: err.message})
    }

  }
  async _getRosters(req, res, next) {
    try {
      var out = await this._getRostersForGame(req.params.id);

      if (out) {
        return res.send(out)
      }
    } catch (err) {
      res.status(500).send({
        message: err.message
      })
    }

  }

  async _getAllGames(req, res) {
    try {

      console.log("getting games");


      var fullAgg = [{
        '$addFields': {
          'results': {
            '$cond': {
              'if': {
                '$isArray': '$results'
              },
              'then': '$results',
              'else': [
                '$results'
              ]
            }
          }
        }
      }, {
      '$addFields': {
        'attesters': '$results.attestations.attesterType',
        'results': {
            '$filter': {
              'input': '$results',
              'as': 'res',
              'cond': {'$ne': ['$$res', null]}
            }
          }
      }
    }

  ]

  if (req.query.display == 'playoffs') {
    fullAgg.unshift({
      '$match': {'gameDate': {'$gte': ISODate('2023-08-22T00:00:00Z')}}
    })
  }

  if (req.query.view = 'summary') {
    fullAgg.push({'$project': {
      'awayTeamRoster': 0,
      'homeTeamRoster': 0,
      'results.scores.players': 0
    }})
  }

        var result = await AblGame.aggregate(fullAgg).exec();
        var popString = 'awayTeam homeTeam awayTeamRoster.player homeTeamRoster.player results.winner results.loser'
        if (req.query.view == 'summary') {
          popString = 'awayTeam homeTeam results.winner results.loser'
          console.log('Just the summary!')
        }
        AblGame.populate(result, {path: popString}, function(err, games) {

          if (err) {
            return res.status(500).send({
              message: err.message
            });
          }
          if (!games) {
            return res.status(400).send({
              message: 'No games found.'
            });
          }

          return res.send(games)
        })

    } catch (err) {
      return res.status(500).send({
              message: err.message
            });
    }

  }
  async _getRostersForGame(gmID) {

    try {

      var gm = await AblGame.findById(gmID).populate('homeTeam awayTeam');
      const day = gm.gameDate

      var homeScore = {regulation: {}, final: {}};
      var awayScore = {regulation: {}, final: {} };
      var result = {};
      var homeErrors = {reg: 0, final: 0}
      var awayErrors = {reg: 0, final: 0}

      var tms = [gm.homeTeam._id, gm.awayTeam._id]


      var lineups = await Promise.all( [gm.homeTeam._id, gm.awayTeam._id].map(async tm=> {
        const lineup = await myAblRoster._getRosterForTeamAndDate(tm, new Date(gm.gameDate));
       // console.log(lineup);
        if (lineup) {
          if (lineup.roster) {
            return lineup.roster;
          } else {
            throw `No roster for team ${tm}.`
            return []
          }
        }

      }));


          if (new Date(day) <= new Date()) {
            // This game should be done by now.

            var lineups_with_stats = await this._getStatsForLineups(lineups, day);

            var lineups_with_starters = await this._getActiveStarters(lineups_with_stats);
              homeErrors = {reg: lineups_with_starters[0].regulationScore(true).e, final:lineups_with_starters[0].finalScore(true).e} ;
              awayErrors = {reg: lineups_with_starters[1].regulationScore(false).e, final:lineups_with_starters[1].finalScore(false).e};

            homeScore = {regulation: lineups_with_starters[0].regulationScore(true, awayErrors.reg), final: lineups_with_starters[0].finalScore(true, awayErrors.final) };
            awayScore = {regulation: lineups_with_starters[1].regulationScore(false, homeErrors.reg), final: lineups_with_starters[1].finalScore(false, homeErrors.reg) };
            while (Math.abs(homeScore.final.abl_runs - awayScore.final.abl_runs) <= 0.5 && (lineups_with_starters[0].benchWithStats().length + lineups_with_starters[1].benchWithStats().length >0 )) {

              lineups_with_starters[0].startNextPlayer("XTRA", lineups_with_starters[0].nextRosterPos() , false );
              lineups_with_starters[1].startNextPlayer("XTRA",lineups_with_starters[1].nextRosterPos() , false);
              homeErrors = {reg: lineups_with_starters[0].regulationScore(true).e, final:lineups_with_starters[0].finalScore(true).e} ;
              awayErrors = {reg: lineups_with_starters[1].regulationScore(false).e, final:lineups_with_starters[1].finalScore(false).e};

              homeScore = {regulation: lineups_with_starters[0].regulationScore(true, awayErrors.reg), final: lineups_with_starters[0].finalScore(true, awayErrors.final) };
              awayScore = {regulation: lineups_with_starters[1].regulationScore(false, homeErrors.reg), final: lineups_with_starters[1].finalScore(false, homeErrors.final) };
            }

            result = {
              winner: homeScore.final.abl_runs > awayScore.final.abl_runs ? gm.homeTeam : gm.awayTeam,
              loser: homeScore.final.abl_runs > awayScore.final.abl_runs ? gm.awayTeam: gm.homeTeam
            }

            lineups_with_starters[0].order()
            lineups_with_starters[1].order()
            return {
             homeTeam: lineups_with_starters[0],
             awayTeam: lineups_with_starters[1],
             home_score: homeScore,
             away_score: awayScore,
             result: result,
             status: "live"
            }

          } else {
            return {
             homeTeam: lineups[0],
             awayTeam: lineups[1],
             home_score: homeScore,
             away_score: awayScore,
             result: result,
             status: "scheduled"
            }
          }

          } catch (err) {
      console.log("Error in _getRostersForGame:" + err);
    }

  }

  _getActiveStarters(lineups) {
    return lineups.map((lineup) => {
     var newLineup = new lineupArray(...lineup)

     for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
       // Loop through position players first, placing only the first player into the spot.
       if(ABL_STARTERS[starter] != "DH" ) {
         newLineup.startNextPlayer(ABL_STARTERS[starter], starter, true );
       }
     }

     for (starter = 0; starter < ABL_STARTERS.length; starter++) {
       // Loop through again, ensuring that all positions fill all their PAs (and then fill in the DH).
       newLineup.startNextPlayer(ABL_STARTERS[starter], starter, false);
     }


     return newLineup
   })
 }

 _getStartersOnly(lineups) {
    return lineups.map((lineup) => {
     var newLineup = new lineupArray(...lineup)

     for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
       // Loop through position players first, placing only the first player into the spot.
       if(ABL_STARTERS[starter] != "DH" ) {
         newLineup.startNextPlayer(ABL_STARTERS[starter], starter, true);
       }
     }

     for (starter = 0; starter < ABL_STARTERS.length; starter++) {
       // Loop through again, ensuring that all positions fill all their PAs (and then fill in the DH).
       newLineup.startNextPlayer(ABL_STARTERS[starter], starter, false);
     }


     return newLineup
   })
 }


async _getStatsForLineups(lineups, current_date) {

   var nextDay = new Date(current_date.toISOString());
   nextDay.setDate(current_date.getDate() + 1)
   console.log("Searching stats between " + current_date + " and " + nextDay);
   var dailyStats = await Statline.aggregate([
         {
           '$match': {
             'gameDate': {
               '$gte': new Date(current_date.toISOString().substring(0, 10) + "T08:00:00Z"),
               '$lt': new Date(nextDay.toISOString().substring(0, 10) + "T08:00:00Z")
             }
           }
         }, {
           '$lookup': {
             'from': 'players',
             'localField': 'mlbId',
             'foreignField': 'mlbID',
             'as': 'player'
           }
         }, {
           '$addFields': {
             'player': {
               '$first': '$player'
             },
             'stats': { '$ifNull': [ "$updatedStats", "$stats" ] }
           }
         }
       ]);

   console.log(dailyStats.length + " stat records found.");

   return lineups.map( (lineup) => {
     if (lineup) {
       return lineup.map((plyr) => {


         var player_stats =  dailyStats.filter((statline) => {
               return (statline.mlbId == plyr.player.mlbID);

           })
           .map(this._getDailyStats)
           .reduce( function getSum(total, thisRec) {
             for (var propertyName in thisRec) {
               // propertyName is what you want
               // you can get the value like this: myObject[propertyName]
               switch (propertyName) {
                 case 'mlbId':
                   total.mlbId = thisRec.mlbId;
                   break;
                 case 'gamePk':
                 case 'gameDate':
                 case 'position(s)':
                   total[propertyName].push(thisRec[propertyName])
                   break;
                 case 'abl_score':
                   total.abl_score.abl_points += ( thisRec.abl_points || 0);
                   total.abl_score.e += (thisRec.e || 0);
                   total.abl_score.ab += (thisRec.ab || 0);
                   total.abl_score.abl_runs =  total.abl_score.abl_points / total.abl_score.ab - 0.5 * total.abl_score.e - 4.5;
                   break;
                 default:
                   total[propertyName] = (total[propertyName] || 0) + parseInt(thisRec[propertyName] || 0)
               }

             }

             return total;
           }, {
             'gamePk': [],
             'gameDate': [],
             'position(s)': [],
             'abl_score': {abl_runs: 0, abl_points: 0, e: 0, ab: 0, h: 0, "2b": 0, "3b": 0, "hr": 0, "bb": 0, "ibb": 0, "hbp": 0, "sb": 0, "cs": 0, "sac": 0, "sf": 0, "e": 0}
           });
         //console.log(`Stats for ${plyr.player.name} updating.`);

         plyr.player.stats = {};
        // console.log("before update");
       //  console.log(plyr);
         plyr.dailyStats = player_stats;
        // if (plyr.player.name == "Max Muncy") {
          // console.log( plyr.dailyStats)

        //   console.log(plyr)
        //   console.log("after update");
        //   plyr.prop = "New Prop"
        // }

         return plyr;
 //         return {
 //           player: plyr,
 //           dailyStats: player_stats
 //         }
       });
     } else {
       return []
     }

   });

 }

 async _post(req, res) {

  let gamesToCreate = []

if (Array.isArray(req.body)) {
// Need to loop through, as there are several games in here...

  gamesToCreate = req.body
} else {
  gamesToCreate = [req.body]
}

try {
  let createdGames = []
  for (let g=0; g<gamesToCreate.length; g++) {
    let newGame = await this.createNewGame(gamesToCreate[g])
    createdGames.push(newGame)
  }
  res.send(createdGames[0])
} catch(e) {

  return res.status(500).send( e.message)
}

}

async createNewGame(gameDetails) {

try {
  let existingGame = await AblGame.findOne({
    awayTeam: gameDetails.awayTeam,
    homeTeam: gameDetails.homeTeam,
    gameDate: gameDetails.gameDate
  })

  if (existingGame) {
    throw new Error('You have already created a game with those details')
  }

  const game = new AblGame({
    awayTeam: (typeof gameDetails.awayTeam === "object") ? gameDetails.awayTeam._id : new ObjectId(gameDetails.awayTeam),
    homeTeam: (typeof gameDetails.homeTeam === "object") ? gameDetails.homeTeam._id : new ObjectId(gameDetails.homeTeam),
    gameDate: gameDetails.gameDate,
    description: gameDetails.description,
    gameType: gameDetails.gameType || "R"
  });
  let output = await game.save()
  console.log(output)
    return output;

} catch (err) {
  throw err
}

}




_put(req, res) {
  AblGame.findById(req.params.id, (err, game) => {
    if (err) {
      return res.status(500).send({
        message: err.message
      });
    }
    if (!game) {
      return res.status(400).send({
        message: 'Game not found.'
      });
    }
    game.description = req.body.description;
    game.awayTeam = req.body.awayTeam._id;
    game.homeTeam = req.body.homeTeam._id;
    game.gameDate = req.body.gameDate;

    game.save(err => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      res.send(game);
    });
  });
}

async _updateResultsServer(gmId, result) {
  var updatedGame
  var result
     try {
       var updateStatement
          result.status = _updateAttestStatus(result.attestations.length)

       if (result._id) {
         // Saved result exists, want to Overwrite it.
        updatedGame = await AblGame.findOneAndUpdate(
          {_id: ObjectId(gmId), "results._id": ObjectId(result._id)},
            { $set: {"results.$": result} },
            { new: true, useFindAndModify: false }
        );



       } else {

         // This is a new result. We want to push it to the list.
         result._id = ObjectId();
         console.log(result);
          updatedGame = await AblGame.findByIdAndUpdate(
            gmId,
            { $addToSet: {results: result} },
            { new: true, useFindAndModify: false }
        );
       }
       let updatedResult = await updatedGame.results.find((qresult)=> {
         return JSON.stringify(qresult._id) == JSON.stringify(result._id)
       })
        return updatedResult
    } catch (e) {
      console.log(e)
      return {
            error: { message: 'e', resend: true }
        };
    }
}

async _updateResults(req, res)  {
  // Needs to be refactored to use the "_updateResultsServer" function.
  var updatedGame
  var result
     try {
       var updateStatement
          req.body.status = _updateAttestStatus(req.body.attestations.length)

       if (req.body._id) {
         // Saved result exists, want to Overwrite it.
        updatedGame = await AblGame.findOneAndUpdate(
          {_id: ObjectId(req.params.id), "results._id": ObjectId(req.body._id)},
            { $set: {"results.$": req.body} },
            { new: true, useFindAndModify: false }
        );



       } else {

         // This is a new result. We want to push it to the list.
         req.body._id = ObjectId();
          updatedGame = await AblGame.findByIdAndUpdate(
            req.params.id,
            { $addToSet: {results: req.body} },
            { new: true, useFindAndModify: false }
        );
       }
       result = await updatedGame.results.find((result)=> {
         return JSON.stringify(result._id) == JSON.stringify(req.body._id)
       })
        res.json(result);
    } catch (e) {
      console.log(e)
      return res.status(422).send({
            error: { message: 'e', resend: true }
        });
    }
}

 async _postResults(req, res) {

  var updatedGame
  var result
     try {
       var updateStatement
          req.body.status = _updateAttestStatus(req.body.attestations.length)


       // This is a new result. We want to push it to the list.
         req.body._id = ObjectId();
          updatedGame = await AblGame.findByIdAndUpdate(
            req.params.id,
            { $addToSet: {results: req.body} },
            { new: true, useFindAndModify: false }
        );
       result = updatedGame.results.find((thingy)=> {
         return JSON.stringify(thingy._id) == JSON.stringify(req.body._id)
       })
       res.json(result);
    } catch (e) {
      console.log(e)
      return res.status(422).send({
            error: { message: 'e', resend: true }
        });
    }
}

async _removeAttestation(req, res) {

     try {

        const updatedGame = await AblGame.findById(req.params.id)
        //
        var r = req.body.result_index
          for (var a = 0; a<updatedGame.results[r].attestations.length; a++) {
            console.log(`Stored AttId: ${updatedGame.results[r].attestations[a]._id}`)
            console.log(`Passed AttId: ${ObjectId(req.body.attestation_id)}`)
            console.log(updatedGame.results[r].attestations[a]._id == req.body.attestation_id)
            if (updatedGame.results[r].attestations[a]._id == req.body.attestation_id) {
              console.log("Removing something!!")
              updatedGame.results[r].attestations.splice(a, 1)
              updatedGame.results[r].status = _updateAttestStatus(updatedGame.results[r].attestations.length)
            }
          }
        //}
        var output = await updatedGame.save()
        res.json(output);
    } catch (e) {
      console.log(e)
        return res.status(422).send({
            error: { message: e, resend: true }
        });
    }
}

async _removeAttestation2(req, res) {

     try {

        const updatedGame = await AblGame.findById(req.params.id)
        //
        var r = updatedGame.results.indexOf(updatedGame.results.find((result)=>{return result._id == req.params.scoreId}));
        console.log(`scoreId: ${req.params.scoreId}`);
       console.log(`found Result at index: ${r}`);
          for (var a = 0; a<updatedGame.results[r].attestations.length; a++) {

            if (updatedGame.results[r].attestations[a]._id == req.params.attId) {
              updatedGame.results[r].attestations.splice(a, 1)
              updatedGame.results[r].status = _updateAttestStatus(updatedGame.results[r].attestations.length)
            }
          }
        //}
        var output = await updatedGame.save()
        res.json(output);
    } catch (e) {
      console.log(e)
        return res.status(422).send({
            error: { message: e, resend: true }
        });
    }
}
 async _addAttestation(req, res) {

     try {

        const updatedGame = await AblGame.findById(req.params.id)
        //
        var r = req.params.scoreIdx

       var updatedResult = updatedGame.results.find((result)=> {
         return result._id == r
       });

       var updateAtt
       if (req.body._id) {
         // Prior Att exists. Overwrite it.
         updateAtt = updatedResult.attestations.find((att)=> {return att._id == req.body._id})
         updateAtt.time = new Date();
       } else {
         // Prior att doesn't exist. Create new.
        updateAtt = req.body
        updateAtt._id = ObjectId();
        updateAtt.time = new Date()
        updatedResult.attestations.push(updateAtt);
       }

       updatedResult.status = _updateAttestStatus(updatedResult.attestations.length)

       var output = await updatedGame.save()
        res.json(updatedResult);
    } catch (e) {
      console.log(e)
        return res.status(422).send({
            error: { message: e, resend: true }
        });
    }
}
 async _deleteResult(req, res) {

     try {

       const updatedGame = await AblGame.update( { _id: req.params.id }, { $pull: { results: {_id: ObjectId(req.params.resultId) } }} )

       res.json(updatedGame);
    } catch (e) {
      console.log(e)
        return res.status(422).send({
            error: { message: e, resend: true }
        });
    }
}

 async _getOldResultGames(req, res) {
  try {
      var result = await AblGame.aggregate([
                                            {
                                              '$addFields': {
                                                'results': {
                                                  '$cond': {
                                                    'if': {
                                                      '$isArray': '$results'
                                                    },
                                                    'then': '$results',
                                                    'else': [
                                                      '$results'
                                                    ]
                                                  }
                                                }
                                              }
                                            }, {
                                              '$addFields': {
                                                'results': {
                                                  '$filter': {
                                                    'input': '$results',
                                                    'as': 'res',
                                                    'cond': {
                                                      '$ne': [
                                                        '$$res', null
                                                      ]
                                                    }
                                                  }
                                                }
                                              }
                                            }, {
                                              '$match': {
                                                'results': {
                                                  '$elemMatch': {
                                                    '_id': {
                                                      '$eq': null
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          ]
                                          ).exec(function(err, games) {

        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        if (!games) {
          return res.status(400).send({
            message: 'No games found.'
          });
        }
        return res.send(games)
      })

  } catch (err) {
    return res.status(500).send({
            message: err.message
          });
  }

}

 async _addIdToResult(req, res) {
  try {

    var pre = await AblGame.findById(ObjectId(req.params.gameId))
    console.log(req.params.gameId);

    console.log(pre)

    if (pre) {
      if (Array.isArray(pre.results)) {

            pre.results.forEach((gameRes)=> {
              if (!gameRes._id) {
                gameRes._id = ObjectId()
              }
            })
          } else {
            if(!pre.results._id) {
              pre.results._id = ObjectId()
            }
          }
    }

    pre.save(function(err, gm) {
            if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        if (!gm) {
          return res.status(400).send({
            message: 'No games found.'
          });
        }
        return res.send(gm)
    })



  } catch (err) {
    return res.status(500).send({
            message: err.message
          });
  }

}



async getAllUnprocessedGames(dt) {

const toDt = dt //new Date()

const fromDt = new Date((new Date(toDt)).setDate(toDt.getDate() -1))
try {
let gms = await this.model.find({
  $and: [    {$or: [{results: {$exists: false}},
              {results: {$size: 0}}, {"results": {$elemMatch: {"status": {$ne:  "final"}}}}]},

        {gameDate: {$gte: fromDt}},
        {gameDate: {$lte: toDt}}
      ]}).exec()

return gms
} catch (err) {
console.error(err)
}
}
async getAllGamesForDate(dt) {

  const toDt = dt //new Date()

  const fromDt = new Date((new Date(toDt)).setDate(toDt.getDate() -1))
  try {
  let gms = await this.model.find({
    $and: [{gameDate: {$gte: fromDt}},
          {gameDate: {$lte: toDt}}
        ]}).exec()

  return gms
  } catch (err) {
  console.error(err)
  }
  }

async processGames(req, res){
  try {

    let myDt = req.params.gameDate ? new Date(req.params.gameDate) : new Date()
    if (req.params.gameDate) {
      myDt = new Date((new Date(myDt)).setDate(myDt.getDate() +1))
    }
    let gms = await this.getAllUnprocessedGames(myDt);
    console.log(req.query?.force);
    if (req.query.force) {
      console.log("I'm in here")
      gms = await this.getAllGamesForDate(myDt);
    }
    console.log(gms)
    for (let g=0; g<gms.length; g++) {
      this.createAndSaveResult(gms[g]._id)

    }

    console.log(`${gms.length} game results saved.`)


    res.json(gms);
 } catch (e) {
   console.log(e)
     return res.status(422).send({
         error: { message: e, resend: true }
     });
 }
}

convertRosterScores(players, team,  location, score) {
  return {
    players: players,
    team: team,
    location: location,
    regulation: score.regulation,
    final: score.final
  }
}

async createAndSaveResult(gmId) {
try {
  const gm = await this._getByIdBackend(gmId);
  let rosters = await this._getRostersForGame(gmId)
  let saveResults ={}
  if (rosters) {
    const gameContent =rosters //.data
    const live_result = {
      status: gameContent.status,
      scores: [this.convertRosterScores(gameContent.homeTeam, gm.data.homeTeam._id, 'H', gameContent.home_score), this.convertRosterScores(gameContent.awayTeam, gm.data.awayTeam._id, 'A', gameContent.away_score)],
      winner: gameContent.result.winner,
      loser: gameContent.result.loser,
      attestations: []
    }
    saveResults = await this._updateResultsServer(gmId, live_result);

    console.log(`Game result saved: ${gmId}`);
  }
  return saveResults
} catch (err) {
  console.error(err)
}
}

async _viewGet(req, res, next) {

  try {
    let gameRes = await GameResultsView.find().populate('homeTeam awayTeam').exec()
    if (gameRes) {
      res.json(gameRes)
    }

  }
  catch(err) {
    return next(err)
  }
}



reroute() {
  router = this.route();
  router.get('/allgames', (...args) => this._getAllGames(...args));
  router.get('/game/:id', (...args) => this._getById(...args) );
  router.get('/game/:id/rosters', (...args) => this._getRosters(...args));
  router.post('/game/new',  (...args) => this._post(...args));
  router.put('/game/:id', (...args)=>this._put(...args));
  router.put('/game/:id/results', (...args)=>this._updateResults(...args));
  //router.put('/game/:id/attestations', jwtCheck, this._removeAttestation);
  router.post('/game/:id/score/:scoreIdx/attestations', (...args)=>this._addAttestation(...args));
  router.delete('/game/:id/score/:scoreId/attestations/:attId', (...args)=>this._removeAttestation2(...args));
  router.post('/game/:id/results', (...args)=>this._postResults(...args));
  router.delete('/game/:id/results/:resultId', (...args)=>this._deleteResult(...args));
  router.get('/games/oldResults', (...args)=>this._getOldResultGames(...args));
  router.post('/games/oldResults/:gameId', (...args)=>this._addIdToResult(...args));
  router.get('/games/process/:gameDate', (...args)=>this.processGames(...args));
  router.get('/gameresults', (...args)=>this._viewGet(...args));
  return router;
}


  }


module.exports = ABLGameController
