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
      }, 
      'results.scores.unadjusted_runs': {
        '$subtract': [
          {
            '$divide': [
              '$results.scores.final.abl_points', '$results.scores.final.ab'
            ]
          }, 4.5
        ]
      }
    }
  }, {
    '$sort': {
      'teams': 1, 
      'gameDate': -1
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
      'outcomes': {
        '$push': {
          '$cond': [
            {
              '$eq': [
                {
                  '$toObjectId': '$results.scores.team'
                }, '$teams'
              ]
            }, '$outcome', '$$REMOVE'
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
      'avg_runs': {
        '$avg': '$scores.unadjusted_runs'
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
      }, 
      'l10': {
        '$reduce': {
          'input': {
            '$slice': [
              '$outcomes', 10
            ]
          }, 
          'initialValue': {
            'w': 0, 
            'l': 0
          }, 
          'in': {
            '$cond': [
              {
                '$eq': [
                  '$$this', 'w'
                ]
              }, {
                'w': {
                  '$sum': [
                    '$$value.w', 1
                  ]
                }, 
                'l': '$$value.l'
              }, {
                'w': '$$value.w', 
                'l': {
                  '$sum': [
                    '$$value.l', 1
                  ]
                }
              }
            ]
          }
        }
      }
    }
  }, {
    '$addFields': {
      'streak': {
        '$reduce': {
          'input': '$outcomes', 
          'initialValue': {
            'type': null, 
            'count': 0, 
            'active': true
          }, 
          'in': {
            '$cond': [
              {
                '$and': [
                  {
                    '$eq': [
                      {
                        '$ifNull': [
                          '$$value.type', '$$this'
                        ]
                      }, '$$this'
                    ]
                  }, '$$value.active'
                ]
              }, {
                'type': '$$this', 
                'count': {
                  '$add': [
                    '$$value.count', 1
                  ]
                }, 
                'active': true
              }, {
                'type': '$$value.type', 
                'count': '$$value.count', 
                'active': false
              }
            ]
          }
        }
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