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
          },
          'results.scores.gameId': '$_id',
          'results.scores.outcome': {
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
          'outcomes': {
            '$push': {
              '$cond': [
                {
                  '$eq': [
                    {
                      '$toObjectId': '$results.scores.team'
                    }, '$teams'
                  ]
                }, {
                  'outcome': '$results.scores.outcome',
                  'gameDate': '$gameDate'
                }, '$$REMOVE'
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
                        '$results.scores.outcome', 'w'
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
                        '$results.scores.outcome', 'l'
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
            '$subtract': [
              {
                '$divide': [
                  {
                    '$sum': '$scores.final.abl_points'
                  }, {
                    '$sum': '$scores.final.ab'
                  }
                ]
              }, 4.5
            ]
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
        '$project': {
          'scores': 0,
          'scores_against': 0
        }
      }, {
        '$unwind': {
          'path': '$tm',
          'preserveNullAndEmptyArrays': true
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


        let scoreDateSorter =(a,b)=> {return new Date(b.gameDate)- new Date(a.gameDate)}

        for (let tm = 0 ; tm<standings.length; tm++) {
          let outcomes = standings[tm].outcomes.sort(scoreDateSorter);
          //let scores = standings[tm].scores.sort((a,b)=> scoreDateSorter)
          //let scoresAgainst = standings[tm].scores
          let strType = outcomes[0].outcome
          let strCount = 0

          do  {
            strCount++
          } while (outcomes[strCount].outcome == strType)

          let l10 =outcomes.slice(0, 10).reduce((tot,cur)=> {

            if (cur.outcome == 'w') {
              return {w: tot.w+1, l: tot.l}
            } else {
              return {w: tot.w, l: tot.l+1}
            }
          }, {w: 0, l:0})

          standings[tm].l10 = l10
          standings[tm].streak = {type: strType, count: strCount, active: false}
          console.log(standings[tm].streak)
          console.log(outcomes.slice(0,10))
        }



      res.send(standings);
    });
  }


}

module.exports = StandingsController
