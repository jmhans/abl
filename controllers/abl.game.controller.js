/*jshint esversion: 8 */

const request = require('request');
const AblGame = require('./../models/Game');
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
var StatlineController = require('./statline.controller');
const Statline = require('./../models/statline');

const ObjectId = require('mongoose').Types.ObjectId;


  function canPlayPosition(playerPosition, lineupSlot) {
    switch (lineupSlot) {
      case "DH":
      case "XTRA":
        return true;
      default:
        return (playerPosition == lineupSlot)
    }
  }



class statline {
  constructor(statline) {
    
    this.plateAppearances = (statline.bb || 0) + (statline.ab || 0 )+ (statline.sac || 0)+ (statline.sf || 0)
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

var AblGameController = {

  canPlayPosition: function(playerPosition, lineupSlot) {
    switch (lineupSlot) {
      case "DH":
      case "XTRA":
        return true;
      default:
        return (playerPosition == lineupSlot)
    }
  },
  

  
  _getDailyStats: function(statlineObj) {
    var retObj = {};
    if (typeof(statlineObj.stats) != 'undefined') {
      retObj = {
        'mlbId': statlineObj.mlbId,
        'gamePk': statlineObj.gamePk,
        'gameDate': statlineObj.gameDate,
        'g': statlineObj.stats.batting.gamesPlayed,
        'ab': statlineObj.stats.batting.atBats,
        'h': statlineObj.stats.batting.hits,
        '2b': statlineObj.stats.batting.doubles,
        '3b': statlineObj.stats.batting.triples,
        'hr': statlineObj.stats.batting.homeRuns,
        'bb': statlineObj.stats.batting.baseOnBalls,
        'ibb': statlineObj.stats.batting.intentionalWalks,
        'hbp': statlineObj.stats.batting.hitByPitch,
        'sb': statlineObj.stats.batting.stolenBases,
        'cs': statlineObj.stats.batting.caughtStealing,
        'sac': statlineObj.stats.batting.sacBunts,
        'sf': statlineObj.stats.batting.sacFlies,
        'e': statlineObj.stats.fielding.errors,
        'position(s)': statlineObj.positions
        
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
        7 * (retObj.sb - retObj.cs || 0) + 
        5 * (retObj.sac + retObj.sf || 0);
    
     var ablruns = ablPts / retObj.ab - 0.5 * retObj.e - 4.5;
    retObj.abl_points = ablPts;
    retObj.abl_score = ablruns;
    return retObj;
  },

  _saveGameRoster: function(roster, gameObj, rosterType) {
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
  },


  _getById: function(req, res) {
    AblGame.findById(req.params.id).populate('awayTeam homeTeam awayTeamRoster.player homeTeamRoster.player').exec(function(err, game) {
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
      // AblGameController._processGame(game);
      res.send(game);
    });

  },

  _getRosters: async function(req, res, next) {
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

  },

  _getAllGames: async function(req, res) {
    try {
        var result = await AblGame.aggregate([{
            '$addFields': {
              'attesters': '$results.attestations.attesterType'
            }
          }
        ]);
        AblGame.populate(result, {path: 'awayTeam homeTeam awayTeamRoster.player homeTeamRoster.player'}, function(err, games) {

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
//           else {
//             games.forEach(gm => {
//               gamesArr.push(gm);
//             });
//           }
          return res.send(games)
        })  
      
    } catch (err) {
      return res.status(500).send({
              message: err.message
            });
    }
    
  },
  _delete: function(req, res) {
    AblGame.findById(req.params.id, (err, gm) => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (!gm) {
        return res.status(400).send({
          message: 'Game not found.'
        });
      }
      gm.remove(err => {
        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        res.status(200).send({
          message: 'Game successfully deleted.'
        });
      });
    });
  },

  _getRostersForGame: async function(gmID) {

    try {

      var gm = await AblGame.findById(gmID).populate('homeTeam awayTeam');
      const day = gm.gameDate
      
      var homeScore = {regulation: {}, final: {}}; 
      var awayScore = {regulation: {}, final: {} }; 
      var result = {};
      var homeErrors = {reg: 0, final: 0}
      var awayErrors = {reg: 0, final: 0}
      var lineups = await Promise.all( [gm.homeTeam._id, gm.awayTeam._id].map(async tm=> {
        const lineup = await myAblRoster._getRosterForTeamAndDate(tm, new Date(gm.gameDate));
       // console.log(lineup);
        return lineup.roster;
      }));

          if (new Date(day) <= new Date()) {
            // This game should be done by now. 
            
            var lineups_with_stats = await this._getStatsForLineups(lineups, day);
            
            var lineups_with_starters = await this._getActiveStarters(lineups_with_stats);
              homeErrors = {reg: lineups_with_starters[0].regulationScore(true).e, final:lineups_with_starters[0].finalScore(true).e} ;
              awayErrors = {reg: lineups_with_starters[1].regulationScore(false).e, final:lineups_with_starters[1].finalScore(false).e};

            homeScore = {regulation: lineups_with_starters[0].regulationScore(true, awayErrors.reg), final: lineups_with_starters[0].finalScore(true, awayErrors.final) }; 
            awayScore = {regulation: lineups_with_starters[1].regulationScore(false, homeErrors.reg), final: lineups_with_starters[1].finalScore(false, homeErrors.reg) }; 
            while (Math.abs(homeScore.final.abl_runs - awayScore.final.abl_runs) < 0.5) {
              
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
             status: "Final"
            } 

          } else {
            return {
             homeTeam: lineups[0],
             awayTeam: lineups[1],
             home_score: homeScore,
             away_score: awayScore, 
             result: result,
             status: "Scheduled"
            }
          }
       
          } catch (err) {
      console.log("Error in _getRostersForGame:" + err);
    }



    //        AblGameController._saveGameRoster( finalRoster, gameObj, rosterType);



  },
  
  
  _getActiveStarters: function (lineups) {
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
  },
  
  _getStartersOnly: function(lineups) {
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
  },
  
 
  
  

  _getStatsForLineups: async function(lineups, current_date) {
    
    var nextDay = new Date(current_date.toISOString());
    nextDay.setDate(current_date.getDate() + 1)
    console.log("Searching stats between " + current_date + " and " + nextDay);
    var dailyStats = await Statline.find({
      gameDate: {
        $gte: current_date.toISOString().substring(0, 10) + "T08:00:00Z",
        $lt: nextDay.toISOString().substring(0, 10) + "T08:00:00Z"
      }
    })

    console.log(dailyStats.length + " stat records found.");

    return lineups.map( (lineup) => {
      
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
                  total[propertyName].concat(thisRec[propertyName])
                  break;
                case 'abl_score': 
                  total.abl_score.abl_points += ( thisRec.abl_points || 0);
                  total.abl_score.e += (thisRec.e || 0);
                  total.abl_score.ab += (thisRec.ab || 0);
                  total.abl_score.abl_runs =  total.abl_score.abl_points / total.abl_score.ab - 0.5 * total.abl_score.e - 4.5;
                  break;
                default:
                  total[propertyName] = (total[propertyName] || 0) + parseInt(thisRec[propertyName])
              }

            }

            return total;
          }, {
            'gamePk': [],
            'gameDate': [],
            'position(s)': [], 
            'abl_score': {abl_runs: 0, abl_points: 0, e: 0, ab: 0}
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
    });

  },


  _post: function(req, res) {

    AblGame.findOne({
      awayTeam: req.body.awayTeam,
      homeTeam: req.body.homeTeam,
      gameDate: req.body.gameDate
    }, (err, existingGame) => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (existingGame) {
        return res.status(409).send({
          message: 'You have already created a game with those details.'
        });
      }
      const game = new AblGame({
        awayTeam: (typeof req.body.awayTeam === "object") ? req.body.awayTeam._id : new ObjectId(req.body.awayTeam),
        homeTeam: (typeof req.body.homeTeam === "object") ? req.body.homeTeam._id : new ObjectId(req.body.homeTeam),
        gameDate: req.body.gameDate,
        description: req.body.description
      });
      game.save((err) => {
        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        res.send(game);
      });
    });


  },

  _put: function(req, res) {
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
  },
  
  _updateResults: async (req, res) => {
    
       try {
          const updatedGame = await AblGame.findByIdAndUpdate(
              req.params.id,
              { $set: {results: req.body} },
              { new: true }
          );
          res.json(updatedGame);
      } catch (e) {
          return res.status(422).send({
              error: { message: 'e', resend: true }
          });
      } 
  }



}


module.exports = AblGameController