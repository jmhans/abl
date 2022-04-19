const BaseController = require('./base.controller');
const Team = require('../models/owner').AblTeam;
const Game = require('../models/Game');

class StandingsController extends BaseController {

  constructor() {
    super(Team, 'standings');
  }
_get(req, res, next) {
  Game.aggregate(
[
  {
    '$project': {
      'active': 0, 
      'homeTeamRoster': 0, 
      'awayTeamRoster': 0
    }
  }, {
    '$unwind': {
      'path': '$results', 
      'preserveNullAndEmptyArrays': false
    }
  }, {
    '$addFields': {
      'teams': [
        '$awayTeam', '$homeTeam'
      ]
    }
  }, {
    '$unwind': {
      'path': '$teams', 
      'preserveNullAndEmptyArrays': false
    }
  }, {
    '$unwind': {
      'path': '$results.scores', 
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$addFields': {
      'outcome': {
        '$cond': [
          {
            '$eq': [
              {
                '$toObjectId': '$results.winner._id'
              }, '$teams'
            ]
          }, 'w', 'l'
        ]
      }
    }
  }, {
    '$group': {
      '_id': '$teams', 
      'scores': {
        '$push': {
          '$cond': [
            {
              '$eq': [
                {
                  '$toObjectId': '$results.scores.team'
                }, '$teams'
              ]
            }, '$results.scores', '$$REMOVE'
          ]
        }
      }, 
      'scores_against': {
        '$push': {
          '$cond': [
            {
              '$ne': [
                {
                  '$toObjectId': '$results.scores.team'
                }, '$teams'
              ]
            }, '$results.scores', '$$REMOVE'
          ]
        }
      }, 
      'w': {
        '$sum': {
          '$cond': [
            {
              '$and': [
                {
                  '$eq': [
                    {
                      '$toObjectId': '$results.scores.team'
                    }, '$teams'
                  ]
                }, {
                  '$eq': [
                    '$outcome', 'w'
                  ]
                }
              ]
            }, 1, 0
          ]
        }
      }, 
      'l': {
        '$sum': {
          '$cond': [
            {
              '$and': [
                {
                  '$eq': [
                    {
                      '$toObjectId': '$results.scores.team'
                    }, '$teams'
                  ]
                }, {
                  '$eq': [
                    '$outcome', 'l'
                  ]
                }
              ]
            }, 1, 0
          ]
        }
      }
    }
  }, {
    '$addFields': {
      'abl_runs': {
        '$avg': '$scores.final.abl_runs'
      }, 
      'ab': {
        '$sum': '$scores.final.ab'
      }, 
      'h': {
        '$sum': '$scores.final.h'
      }, 
      '2b': {
        '$sum': '$scores.final.2b'
      }, 
      '3b': {
        '$sum': '$scores.final.3b'
      }, 
      'hr': {
        '$sum': '$scores.final.hr'
      }, 
      'bb': {
        '$sum': '$scores.final.bb'
      }, 
      'hbp': {
        '$sum': '$scores.final.hbp'
      }, 
      'e': {
        '$sum': '$scores.final.e'
      }, 
      'sb': {
        '$sum': '$scores.final.sb'
      }, 
      'cs': {
        '$sum': '$scores.final.cs'
      }, 
      'sac': {
        '$sum': '$scores.final.sac'
      }, 
      'sf': {
        '$sum': '$scores.final.sf'
      }, 
      'era': {
        '$avg': '$scores_against.final.abl_runs'
      }, 
      'hr_allowed': {
        '$sum': '$scores_against.final.hr'
      }, 
      'g': {
        '$add': [
          '$w', '$l'
        ]
      }, 
      'win_pct': {
        '$divide': [
          '$w', {
            '$add': [
              '$w', '$l'
            ]
          }
        ]
      }
    }
  }, {
    '$lookup': {
      'from': 'ablteams', 
      'localField': '_id', 
      'foreignField': '_id', 
      'as': 'tm'
    }
  }, {
    '$unwind': {
      'path': '$tm', 
      'preserveNullAndEmptyArrays': true
    }
  }, {
    '$project': {
      'scores': 0, 
      'scores_against': 0
    }
  }, {
    '$sort': {
      'win_pct': -1, 
      'abl_runs': -1
    }
  }
]
    
      , function(err, standings) {
      if (err) return next(err);

      res.send(standings);
    });
  }
    
  
}

module.exports = StandingsController