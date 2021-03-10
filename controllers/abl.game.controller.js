/*jshint esversion: 8 */

const request = require('request');
const AblGame = require('./../models/Game');
var AblRosterController = require('./abl.roster.controller').AblRosterController;
var StatlineController = require('./statline.controller');
const Statline = require('./../models/statline');

const ObjectId = require('mongoose').Types.ObjectId;

const ABL_STARTERS = ['1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'C', 'DH']

var AblGameController = {

  canPlayPosition: function(playerPosition, lineupSlot) {
    switch (lineupSlot) {
      case "DH":
        return true;
      default:
        return (playerPosition == lineupSlot)
    }
  },
  
  _ablScore: function(statrec) {

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
        10 * (retObj.ibb || 0)+ 
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

  _getAllGames: function(req, res) {
    AblGame.find({}).populate('awayTeam homeTeam awayTeamRoster.player homeTeamRoster.player').exec(function(err, games) {
      var gamesArr = []
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (!games) {
        return res.status(400).send({
          message: 'No games found.'
        });
      } else {
        games.forEach(gm => {
          gamesArr.push(gm);
        });
      }
      return res.send(gamesArr)
    })
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
      console.log(gm.gameDate);
      console.log(gm);
      
      var lineups = await Promise.all( [gm.homeTeam._id, gm.awayTeam._id].map(async tm=> {const lineup = await AblRosterController._getRosterForTeamAndDate(tm, new Date(day.toISOString()));
                                                                        return lineup;}));
      
      
      var lineups_with_stats = await this._getStatsForLineups(lineups, day);

      var lineups_with_starters = await this._getStarters(lineups_with_stats);
      
      const homeScore = this._getABLScores(lineups_with_starters[0], true);
      const awayScore = this._getABLScores(lineups_with_starters[1], false);
      
      console.log(gm.homeTeam);
      const result = {
        winner: homeScore.abl_runs > awayScore.abl_runs ? gm.homeTeam : gm.awayTeam, 
        loser: homeScore.abl_runs > awayScore.abl_runs ? gm.awayTeam: gm.homeTeam
                     }
      console.log(result);
      
     return {
       homeTeam: lineups_with_starters[0],
       awayTeam: lineups_with_starters[1],
       home_score: homeScore,
       away_score: awayScore, 
       result: result
     }
    } catch (err) {
      console.log("Error in _getRostersForGame:" + err);
    }



    //        AblGameController._saveGameRoster( finalRoster, gameObj, rosterType);



  },

  _getStarters: function(lineups) {

    return lineups.map((lineup) => {
      for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
        var posPAs = 0;
        var posGs = 0;
        var starters = [];
        for (var plyrCt = 0; plyrCt < lineup.length; plyrCt++) {
          var potentialPlayer = lineup[plyrCt];

          if (!potentialPlayer.played && this.canPlayPosition(potentialPlayer.player.lineupPosition, ABL_STARTERS[starter]) && posPAs < 2) {
            // need to check to see if player played (e.g. 'g'>0). 

            if (potentialPlayer.dailyStats && potentialPlayer.dailyStats.g > 0) {

              potentialPlayer.played = true;
              potentialPlayer.playedPosition = ABL_STARTERS[starter];
              posPAs += this.plateAppearances(potentialPlayer.dailyStats)
              posGs += potentialPlayer.dailyStats.g
            }
          }
        }
        if (posPAs < 2) {
          // Need to supplement. Was there anybody that had a game? 
          if (posGs > 0) {
            lineup.push({"player": {"player": {name: "supp"}}, played: true, playedPosition : ABL_STARTERS[starter], dailyStats: {g: 1, ab: 2 - posPAs, h: 0, e: 0}})
          } else {
            lineup.push({"player": {"player": {name: "four"}}, played: true, playedPosition : ABL_STARTERS[starter], dailyStats: {g: 1, ab: 4, h: 0, e: 0}})
          }
          
        }
        
        
      }
      
      return lineup;

    })
  },
  
  _getABLScores: function(lineup, homeTeam = false) {
    return lineup.reduce((total, curPlyr) => {
      
      if (curPlyr.played) {
      total.abl_points += (curPlyr.dailyStats.abl_points || 0);
//              25 * (curPlyr.dailyStats.h || 0) + 
//              10 * (curPlyr.dailyStats["2b"] || 0)+ 
//              20 * (curPlyr.dailyStats["3b"] || 0) + 
//              30 * (curPlyr.dailyStats.hr || 0) + 
//              10 * (curPlyr.dailyStats.bb || 0) + 
//              10 * (curPlyr.dailyStats.ibb || 0)+ 
//              10 * (curPlyr.dailyStats.hbp || 0) + 
//              7 * (curPlyr.dailyStats.sb - curPlyr.dailyStats.cs || 0) + 
//              5 * (curPlyr.dailyStats.sac + curPlyr.dailyStats.sf || 0);
        
        total.e += (curPlyr.dailyStats.e || 0);
        
        total.ab += (curPlyr.dailyStats.ab || 0);
        total.abl_runs = total.abl_points / total.ab - 0.5 * total.e - 4.5 + 0.5 * homeTeam;
      }
      
      return  total;
      
    }, {abl_runs: 0, abl_points: 0, e: 0, ab: 0})
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
        
    return lineups.map((lineup) => {
      
      
      return lineup.map((plyr) => {

        var player_stats = dailyStats.filter((statline) => {
            return (statline.mlbId == plyr.player.mlbID);
          })
          .map(this._getDailyStats)
          .reduce(function getSum(total, thisRec) {
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
        return {
          player: plyr,
          dailyStats: player_stats
        }
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

  plateAppearances: function(statline) {
    return statline.baseOnBalls + statline.intentionalWalks + statline.atBats + statline.sacBunts + statline.sacFlies
  }

}


module.exports = AblGameController