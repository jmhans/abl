const BaseController = require('./base.controller');
const Team = require('../models/owner').AblTeam;

class StandingsController extends BaseController {

  constructor() {
    super(Team, 'standings');
  }
_get(req, res, next) {
  this.model.aggregate(
      [
        {
          '$addFields': {
            'lookupId': {
              '$toString': '$_id'
            }
          }
        }, {
          '$lookup': {
            'from': 'games', 
            'localField': 'lookupId', 
            'foreignField': 'results.winner._id', 
            'as': 'wins'
          }
        }, {
          '$lookup': {
            'from': 'games', 
            'localField': 'lookupId', 
            'foreignField': 'results.loser._id', 
            'as': 'losses'
          }
        }, {
          '$addFields': {
            'record': {
              'w': {
                '$size': '$wins'
              }, 
              'l': {
                '$size': '$losses'
              }, 
              'g': {
                '$add': [
                  {
                    '$size': '$wins'
                  }, {
                    '$size': '$losses'
                  }
                ]
              }
            }
          }
        }
      ], function(err, standings) {
      if (err) return next(err);

      res.send(standings);
    });
  }
  
}

module.exports = StandingsController