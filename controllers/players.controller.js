const Player = require('../models/player').Player;
const BaseController = require('./base.controller');
var express = require('express');
const Statline = require('../models/statline');

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
                lastUpdate: new Date ("2000-01-01"), 
                //games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: shortPositions}],
                //positionLog : []
              })
          }
          if (new Date(gm.gameDate) >= new Date(_playerRecord.lastUpdate) || _playerRecord.lastUpdate == null) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation; 
                _playerRecord.status = player.status.description; 
                _playerRecord.stats = player.seasonStats; 
                _playerRecord.position = ablConfig.POSITION_MAP[player.position.abbreviation] || player.position.abbreviation;
                _playerRecord.lastUpdate = gm.gameDate;
            
          }
          
        const newRec = await _playerRecord.save();
        return _playerRecord;
      } catch (err) {
        console.error(`Error in _updatePlayer:${err}`)
      }

      
      

    }  
  }
  
 async _getEligibility(req, res, next) {
   if (req.params.plyrId) {
     console.log(req.params.plyrId);
      const query = await Statline.aggregate([
          {
            '$match': {
              'mlbId': req.params.plyrId,
              'gameDate': {
                '$gte': new Date('Thu, 01 Apr 2021 00:00:00 GMT')
              }
            }
          }, {
            '$unwind': {
              'path': '$positions', 
              'includeArrayIndex': 'posIdx', 
              'preserveNullAndEmptyArrays': false
            }
          }, {
            '$addFields': {
              'positions': {
                '$cond': [
                  {
                    '$in': [
                      '$positions', [
                        'LF', 'RF', 'CF'
                      ]
                    ]
                  }, 'OF', '$positions'
                ]
              }
            }
          }, {
            '$match': {
              'positions': {
                '$in': [
                  '1B', '2B', '3B', 'DH', 'OF', 'SS', 'C'
                ]
              }
            }
          }, {
            '$group': {
              '_id': {
                'mlbId': '$mlbId', 
                'gamePk': '$gamePk', 
                'pos': '$positions'
              }, 
              'inGameCount': {
                '$sum': 1
              }
            }
          }, {
            '$group': {
              '_id': {
                'mlbId': '$_id.mlbId', 
                'pos': '$_id.pos'
              }, 
              'posCount': {
                '$sum': '$inGameCount'
              }
            }
          }, {
            '$group': {
              '_id': {
                'mlbId': '$_id.mlbId'
              }, 
              'positionsLog': {
                '$push': {
                  'pos': '$_id.pos', 
                  'ct': '$posCount'
                }
              }
            }
          }, {
            '$addFields': {
              'eligiblePositions': {
                '$filter': {
                  'input': '$positionsLog', 
                  'as': 'posObj', 
                  'cond': {
                    '$gte': [
                      '$$posObj.ct', 1 //Should be changed to 10 to match league rules.
                    ]
                  }
                }
              }
            }
          }, {
            '$addFields': {
              'eligiblePositions': '$eligiblePositions.pos'
            }
          }
        ]).exec(function(err, positions) {
        console.log("got here")
          if (err) {
            return res.status(500).send({
              message: err.message
            });
          }
          if (!positions) {
            return res.status(400).send({
              message: 'No player found.'
            });
          } 
        console.log(positions);
          return res.send(positions[0].eligiblePositions)
        })
   }
 }
  
    route() {
    router.get('/' + this.routeString + '/:plyrId/eligibility' , (...args) => this._getEligibility(...args));
    return router;
  }
  
  
  
}

module.exports = PlayersController

