/*jshint esversion: 8 */

const request = require('request');
const AblGame = require('./../models/Game');
var AblRosterController = require('./abl.roster.controller');
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

  _processGame: function(gameObj) {
    /* gameDate: { type: Date, required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true}, 
    homeTeam: { type: Schema.Types.ObjectId, ref:'AblTeam', required: true}, 
    description: String,
    awayTeamRoster: [{type: gamePlayerSchema}], 
    homeTeamRoster: [{type: gamePlayerSchema}],
    awayScore: { type: Number, required: false},
    homeScore: { type: Number, required: false},
    winner: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false}, 
    loser: {type : Schema.Types.ObjectId, ref:'AblTeam', required: false} */

    //Retrieve rosters for teams


    this._getRoster(gameObj, "H")
    this._getRoster(gameObj, "A")


    // ABL_STARTERS
    //     for (var starter = 0; starter<ABL_STARTERS.length; starter++) {
    //       gameObj.awayTeamRoster
    //     }


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
      AblGameController._processGame(game);
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

  _getRoster: function(gameObj, rosterType) {
    var targetTeamId = '';
    switch (rosterType) {
      case "H":
        targetTeamId = gameObj.homeTeam._id
        break;
      case "A":
        targetTeamId = gameObj.awayTeam._id
        break;
      default:
        // code block
        targetTeamId = gameObj.homeTeam._id
    }


    const day = gameObj.gameDate

    var nextDay = new Date(day.toISOString());
    nextDay.setDate(day.getDate() + 1)

    AblRosterController._getRosterForTeamAndDate(targetTeamId, new Date(day.toISOString)).then((resp) => {
      var potentialPlayers = resp
      var finalRoster = []
      // need to retrieve player's stats for the day...


      Statline.find({
        gameDate: {
          $gte: day.toISOString().substring(0, 10),
          $lt: nextDay.toISOString().substring(0, 10)
        }
      }, (err, stats) => {
        console.log(stats.length + " stat records found.");

        for (var plyrCt = 0; plyrCt < potentialPlayers.length; plyrCt++) {
          var plyr = potentialPlayers[plyrCt];
          plyr.dailyStats = stats.filter((statline) => {
              return (statline.mlbId == plyr.player.mlbID);
            })
            .map(AblGameController._getDailyStats)
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
                  default:
                    total[propertyName] = (total[propertyName] || 0) + parseInt(thisRec[propertyName])
                }

              }

              return total;
            }, {
              'gamePk': [],
              'gameDate': [],
              'position(s)': []
            });
        }

        for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
          var posPAs = 0
          var starters = [];
          for (plyrCt = 0; plyrCt < potentialPlayers.length; plyrCt++) {
            var potentialPlayer = potentialPlayers[plyrCt];

            if (!potentialPlayer.played && AblGameController.canPlayPosition(potentialPlayer.lineupPosition, ABL_STARTERS[starter]) && posPAs < 2) {
              // need to check to see if player played (e.g. 'g'>0). 
              finalRoster.push({
                'player': potentialPlayer.player,
                'lineupPosition': potentialPlayer.lineupPosition,
                'rosterOrder': potentialPlayer.rosterOrder,
                'playedPosition': ABL_STARTERS[starter],
                'box': potentialPlayer.dailyStats
              });
              potentialPlayer.played = true;
              posPAs += AblGameController.plateAppearances(potentialPlayer.dailyStats)
            }
          }


        }

        AblGameController._saveGameRoster(finalRoster, gameObj, rosterType);


      })
    });

  },

  _getRostersForGame: async function(gmID) {

    try {

      var gm = await AblGame.findById(gmID);
      const day = gm.gameDate

      var homeTeamLineup = await AblRosterController._getRosterForTeamAndDate2(gm.homeTeam._id, new Date(day.toISOString()))
      var awayTeamLineup = await AblRosterController._getRosterForTeamAndDate2(gm.awayTeam._id, new Date(day.toISOString()))

      var lineups_with_stats = await this._getStatsForLineups([homeTeamLineup, awayTeamLineup], day);

      var lineups_with_starters = await this._getStarters(lineups_with_stats);

     return {
       homeTeam: lineups_with_starters[0],
       awayTeam: lineups_with_starters[1]
     }
    } catch (err) {
      console.log("Error in _getRostersForGame:" + err);
    }



    //        AblGameController._saveGameRoster( finalRoster, gameObj, rosterType);



  },

  _getStarters: function(lineups) {

    return lineups.map((lineup) => {
      for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
        var posPAs = 0
        var starters = [];
        for (var plyrCt = 0; plyrCt < lineup.length; plyrCt++) {
          var potentialPlayer = lineup[plyrCt];

          if (!potentialPlayer.played && this.canPlayPosition(potentialPlayer.player.lineupPosition, ABL_STARTERS[starter]) && posPAs < 2) {
            // need to check to see if player played (e.g. 'g'>0). 

            if (potentialPlayer.dailyStats && potentialPlayer.dailyStats.g > 0) {

              potentialPlayer.played = true;
              potentialPlayer.playedPosition = ABL_STARTERS[starter];
              posPAs += this.plateAppearances(potentialPlayer.dailyStats)
            }
          }
        }
      }

      return lineup;


    })
  },

  _getStatsForLineups: async function(lineups, current_date) {

    var nextDay = new Date(current_date.toISOString());
    nextDay.setDate(current_date.getDate() + 1)
    var dailyStats = await Statline.find({
      gameDate: {
        $gte: current_date.toISOString().substring(0, 10),
        $lt: nextDay.toISOString().substring(0, 10)
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
                default:
                  total[propertyName] = (total[propertyName] || 0) + parseInt(thisRec[propertyName])
              }

            }

            return total;
          }, {
            'gamePk': [],
            'gameDate': [],
            'position(s)': []
          });
        return {
          player: plyr,
          dailyStats: player_stats
        }
      });
    });

  },


  _getStartersFromLinueup: function(lineup) {
    var finalRoster = [];
    for (var starter = 0; starter < ABL_STARTERS.length; starter++) {
      var posPAs = 0
      var starters = [];
      for (var plyrCt = 0; plyrCt < lineup.length; plyrCt++) {
        var potentialPlayer = lineup[plyrCt];

        if (!potentialPlayer.played && this.canPlayPosition(potentialPlayer.lineupPosition, ABL_STARTERS[starter]) && posPAs < 2) {
          // need to check to see if player played (e.g. 'g'>0). 
          if (potentialPlayer.dailyStats && potentialPlayer.dailyStats.g > 0) {


            finalRoster.push({
              'player': potentialPlayer.player,
              'lineupPosition': potentialPlayer.lineupPosition,
              'rosterOrder': potentialPlayer.rosterOrder,
              'playedPosition': ABL_STARTERS[starter],
              'box': potentialPlayer.dailyStats
            });
            potentialPlayer.played = true;
            posPAs += this.plateAppearances(potentialPlayer.dailyStats)
          }
        }
      }


    }

    return finalRoster;
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