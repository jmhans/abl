const Player = require('../models/player').Player;
const BaseController = require('./base.controller');
var express = require('express');
const Statline = require('../models/statline').Statline;
const PlayerView = require('../models/player').PlayerView;
const PlayerCache = require('../models/player').PlayerCache;
const PlayerNameView = require('../models/player').PlayerNamesView;
const PlayerPositionsView =require('../models/player').PlayerPositionsView;
const ablConfig = require('../server/ablConfig');
var   router = express.Router();



class PlayersController extends BaseController {

  constructor() {
    super(Player, 'players');
  }

  async _updatePlayer(player,team, gm) {

    if (ablConfig._isPositionPlayer(player)) {

      var query = {
        'mlbID': player.person.id
      }
      var shortPositions = player.allPositions.map((pos) => {return pos.abbreviation;})

      try {
        var _playerRecord = await this.model.findOne(query);

          if (_playerRecord) {

          } else {
            // Create a new player record.
              _playerRecord = new this.model({
                mlbID: player.person.id,
                lastStatUpate: new Date ("2000-01-01"),
                //games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: shortPositions}],
                //positionLog : []
              })
          }
          if (new Date(gm.gameDate) >= new Date(_playerRecord.lastStatUpdate) || _playerRecord.lastStatUpdate == null) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation;
              //  _playerRecord.status = player.status.description;
                _playerRecord.stats = player.seasonStats;
              //  _playerRecord.position = ablConfig.POSITION_MAP[player.position.abbreviation] || player.position.abbreviation;
                _playerRecord.lastStatUpdate = gm.gameDate;

          }

        const newRec = await _playerRecord.save();
        return _playerRecord;
      } catch (err) {
        console.error(`Error in _updatePlayer:${err}`)
      }




    }
  }

    async _updatePlayerStatus(player,team) {

    if (player.position.abbreviation != 'P') {

      var query = {
        'mlbID': player.person.id
      }

      try {
        var _playerRecord = await this.model.findOne(query);

          if (!_playerRecord) {
            // Create a new player record.
              _playerRecord = new this.model({
                mlbID: player.person.id,
                lastUpdate: new Date ("2000-01-01"),
                //games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: shortPositions}],
                //positionLog : []
              })
          }
          if (new Date() >= new Date(_playerRecord.lastUpdate) || _playerRecord.lastUpdate == null) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation;
                _playerRecord.status = player.status.description;
                _playerRecord.lastUpdate = new Date();
          }
        const newRec = await _playerRecord.save();
        return _playerRecord;
      } catch (err) {
        console.error(`Error in _updatePlayer:${err}`)
      }




    }
  }





  _get(req, res, next) {
    return this._viewGet(req, res, next)
    let aggSteps = [{
        '$lookup': {
          'from': 'ablteams',
          'localField': 'ablstatus.ablTeam',
          'foreignField': '_id',
          'as': 'ablstatus.ablTeam'
        }
      }, {
        '$unwind': {
          'path': '$ablstatus.ablTeam',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'position_log',
          'let': {
            'plyrId': '$mlbID'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$and': [
                    {
                      '$eq': [
                        '$mlbId', '$$plyrId'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          'as': 'newPosLog'
        }
      }, {
        '$addFields': {
          'newPosLog': {
            '$reduce': {
              'input': '$newPosLog',
              'initialValue': {},
              'in': {
                '$switch': {
                  'branches': [
                    {
                      'case': {
                        '$eq': [
                          '$$this.season', 2025
                        ]
                      },
                      'then': {
                        'curr': '$$this.eligiblePositions',
                        'curr_max':"$$this.maxPosition",
                        'prior': '$$value.prior',
                      }
                    }, {
                      'case': {
                        '$eq': [
                          '$$this.season', 2024
                        ]
                      },
                      'then': {
                        'curr': '$$value.curr',
                        'curr_max': "$$value.curr_max",
                        'prior': '$$this.maxPosition'
                      }
                    }
                  ],
                  'default': '$$value'
                }
              }
            }
          }
        }
      }, {
        '$lookup': {
          'from': 'positions',
          'localField': 'mlbID',
          'foreignField': 'mlbId',
          'as': 'tempCommish'
        }
      }, {
        '$lookup': {
          'from': 'mlbrosters',
          'let': {
            'plyrId': '$mlbID'
          },
          'pipeline': [
            {
              '$unwind': {
                'path': '$roster',
                'preserveNullAndEmptyArrays': true
              }
            }, {
              '$project': {
                'teamId': 1,
                'player': '$roster.person',
                'status': '$roster.status'
              }
            }, {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$$plyrId', {
                      '$toString': '$player.id'
                    }
                  ]
                }
              }
            }
          ],
          'as': 'rosterStatus'
        }
      }, {
        '$addFields': {
          'status': {
            '$first': '$rosterStatus.status.description'
          },
          'allPos': {
            '$concatArrays': [
              [
                {
                  '$ifNull': [
                    {
                      '$first': '$tempCommish.CommishPos'
                    }, {'ifNull': ['$newPosLog.prior', '$newPosLog.curr_max']}
                  ]
                }
              ], {
                '$ifNull': [
                  '$newPosLog.curr', []
                ]
              }
            ]
          }
        }
      }, {
        '$addFields': {
          'eligible': {
            '$filter':{'input': {'$reduce': {
              'input': '$allPos',
              'initialValue': [],
              'in': {
                '$cond': [
                  {
                    '$in': [
                      '$$this', '$$value'
                    ]
                  }, '$$value', {
                    '$concatArrays': [
                      '$$value', [
                        '$$this'
                      ]
                    ]
                  }
                ]
              }
            }}, 'as': 'pos', 'cond': {'$ne': ['$$pos', null]}}
          }
        }
      }, {
        '$project': {
          'commishPos': 0,
          'posLog': 0,
          'newPosLog': 0,
          'tempCommish': 0,
          'allPos': 0,
          'currentYearElig': 0,
          'priorYearElig': 0,
          'position': 0,
          'rosterStatus': 0
        }
      }
    ];
    if (req.query.status) {
      aggSteps.unshift({'$match': {'status' : req.query.status}});
    }

    console.log(`${req.query.status}`);


  this.model.aggregate(aggSteps
      , function(err, players) {
      if (err) return next(err);

      res.send(players);
    });
  }

_viewGet(req, res, next) {

  PlayerView.find(req.query, (err, results)=> {
    if (err) return next(err);
    res.json(results);
  });
}
_getPlayerNames(req, res, next) {

  PlayerNameView.find(req.query, (err, results)=> {
    if (err) return next(err);
    res.json(results);
  });
}


_getPositions(req, res, next) {

  PlayerPositionsView.find(req.query, (err, results)=> {
    if (err) return next(err);
    res.json(results);
  });
}


  reroute() {
    router = this.route();
    //router.get('/players', (...args) => this._viewGet(...args));
    router.get('/playernames', (...args) => this._getPlayerNames(...args));
    router.get('/playerpositions', (...args) => this._getPositions(...args));
    return router;
  }




}

module.exports = PlayersController

