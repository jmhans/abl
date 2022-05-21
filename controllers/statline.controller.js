const Statline = require('../models/statline');
const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();
const ablConfig = require('../server/ablConfig');





class StatlineController extends BaseController {

  constructor() {
    super(Statline, 'statlines');

  }

  _getStatsForPlayer(req, res, next) {

     var searchObj = {};
     if (!req.params.mlbId) {
       return res.status(500).send({message: 'No player selected.'});
     } else {
       searchObj.mlbId = req.params.mlbId
     }
     if (!req.query.gameDate) {
        //Get all games...
     } else {
       const day = new Date(req.query.gameDate)
       var nextDay = new Date(day.toISOString());
       nextDay.setDate(day.getDate() +1)
       searchObj.gameDate = {$gte: day.toISOString().substring(0, 10), $lt: nextDay.toISOString().substring(0, 10)}

     }

     this.model.find(searchObj , (err, results) => {
        if (err) return next(err);
        res.json(results);
      });

   }

  async _updateStatline(plyr, gm) {
    if (plyr.allPositions) {

    var shortPositions = plyr.allPositions.map((pos) => {return pos.abbreviation;})

    const originalDate = gm.resumedFrom ? gm.resumedFrom : gm.gameDate
      var query = {
        'mlbId': plyr.person.id,
        'gamePk': gm.gamePk,
        'gameDate': originalDate
      }

      if (gm.officialDate) {
        // console.log(`${gm.gamePk}: - ` )
      }

       var _statline = {
                mlbId: plyr.person.id,
                gameDate: gm.gameDate,
                gamePk: gm.gamePk,
                stats: plyr.stats,
                positions: shortPositions,
                statlineType: gm.status.detailedState
              };
      try {
        const doc = await this.model.findOne(query);
        if (doc) {
          // One already exists. This could be a suspended game situation. Modify the 'new' stats to reflect only those that happened after the prior document, then create new doc.

          if (new Date(doc.gameDate).toString != new Date(gm.gameDate).toString) {
            // They have stats from the original date. Find the diff for the new date.
            console.log(`Doc: ${doc.gameDate} vs. stats: ${new Date(gm.gameDate)}`)
            console.log(`Doc: ${typeof(new Date(doc.gameDate))} vs. stats: ${typeof(new Date(gm.gameDate))}`)
            _statline.stats = await this._getStatlineDiff(plyr.stats, doc.stats)
            // _statline.gameDate = gm.gameDate  // Use the new game date specifically in the statline.
            query = {
              'mlbId': plyr.person.id,
              'gamePk' : gm.gamePk,
              'gameDate': gm.gameDate // Modify the query so it won't replace the existing doc.
            }
          }
        }
        const doc2 = await this.model.updateMany(query, _statline, { upsert: true });
          return doc2;


      } catch (err) {
        console.error(`Error in _updateStatline:${err}`);
      }
}

  }

  async _getStatlineDiff(fullStat, partialStat) {
    var ret = {batting: {}, fielding: {}, pitching: {}}
    if (fullStat) {
      Object.keys(fullStat.batting).forEach((prop)=> {
        if (typeof(fullStat.batting[prop]) == "number") {
                ret.batting[prop] = fullStat.batting[prop] - (partialStat.batting[prop] || 0)
          }
      })
      Object.keys(fullStat.fielding).forEach((prop)=> {
        if (typeof(fullStat.fielding[prop]) == "number") {
          ret.fielding[prop] = fullStat.fielding[prop] - (partialStat.fielding[prop] || 0)
        }
      })
      Object.keys(fullStat.pitching).forEach((prop)=> {
        if (typeof(fullStat.pitching[prop]) == "number") {
          ret.pitching[prop] = fullStat.pitching[prop] - (partialStat.pitching[prop] || 0)
        }
      })
      return ret
    }
  }

  async _updatePosLogForPlayer(req, res, next) {
    try {
      const slDoc = await this.model.findById(req.params.id).exec();
      const mlbId = slDoc.mlbId
      const currentSeason = new Date(slDoc.gameDate).getFullYear() || 2022;
      const regSeasonStart = new Date('2022-04-07T00:00:00Z')

    var position_log_records = await this.model.aggregate([
{
  '$project': {
    'stats': 0,
    'statlineType': 0
  }
}, {
  '$addFields': {
    'season': {
      '$year': '$gameDate'
    }
  }
}, {
  '$match': {
    'season': currentSeason,
    'mlbId': mlbId
  }
}, {
  '$addFields': {
    'regSeason': {
      '$switch': {
        'branches': [
          {
            'case': {
              '$eq': [
                '$season', currentSeason
              ]
            },
            'then': {
              '$gte': [
                '$gameDate', regSeasonStart
              ]
            }
          }
        ]
      }
    }
  }
}, {
  '$match': {
    '$expr': {
      '$and': [
        {
          '$eq': [
            '$regSeason', true
          ]
        }
      ]
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
    '$expr': {
      '$in': [
        '$positions', [
          '1B', '2B', '3B', 'DH', 'OF', 'SS', 'C'
        ]
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
    },
    'season': {
      '$max': {
        '$year': '$gameDate'
      }
    }
  }
}, {
  '$group': {
    '_id': {
      'mlbId': '$_id.mlbId',
      'pos': '$_id.pos',
      'season': '$season'
    },
    'posCount': {
      '$sum': '$inGameCount'
    }
  }
}, {
  '$group': {
    '_id': {
      'mlbId': '$_id.mlbId',
      'season': '$_id.season'
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
            '$$posObj.ct', 10
          ]
        }
      }
    },
    'maxPosition': {
      '$first': {
        '$filter': {
          'input': '$positionsLog',
          'as': 'posObj',
          'cond': {
            '$and': [
              {
                '$gte': [
                  '$$posObj.ct', {
                    '$max': '$positionsLog.ct'
                  }
                ]
              }
            ]
          }
        }
      }
    }
  }
}, {
  '$addFields': {
    'mlbId': '$_id.mlbId',
    'season': '$_id.season',
    'eligiblePositions': '$eligiblePositions.pos'
  }
}, {
  '$project': {
    '_id': 0
  }
}, {
  '$lookup': {
    'from': 'position_log',
    'let': {
      'mlbId': '$mlbId',
      'ssn': '$season'
    },
    'pipeline': [
      {
        '$match': {
          '$expr': {
            '$and': [
              {
                '$eq': [
                  '$mlbId', '$$mlbId'
                ]
              }, {
                '$eq': [
                  '$season', '$$ssn'
                ]
              }
            ]
          }
        }
      }
    ],
    'as': 'outcoll'
  }
}, {
  '$lookup': {
    'from': 'position_log',
    'let': {
      'lastSsn': {'$subtract': ['$season', 1]},
      'mlbId': '$mlbId'
    },
    'pipeline': [
      {
        '$match': {
          '$expr': {
            '$and': [
              {
                '$eq': [
                  '$mlbId', '$$mlbId'
                ]
              }, {
                '$eq': [
                  '$season', '$$lastSsn'
                ]
              }
            ]
          }
        }
      }
    ],
    'as': 'lastSsnPos'
  }
}, {
  '$addFields': {
    '_id': {
      '$first': '$outcoll._id'
    },
    'maxPosition': '$maxPosition.pos',
    'priorSeasonMaxPos': {
      '$first': '$lastSsnPos.maxPosition.pos'
    }
  }
}, {
  '$project': {
    'outcoll': 0,
    'lastSsnPos': 0
  }
}, {
  '$merge': {
    'into': 'position_log',
    'on': '_id',
    'whenMatched': 'replace',
    'whenNotMatched': 'insert'
  }
}
])


    if (!position_log_records) {
      return res.status(400).send({message: 'No stats found.'});
    }
    return res.send({message: `Positions updated successfully for ${mlbId}`})

  } catch (err) {
    return res.status(500).send({message: err.message });
  }

  }

async _genPositionLog() {
  try {

    var currentSeason = 2022;
    var regSeasonStart = new Date('2022-04-07T00:00:00Z')

    var position_log_records = await this.model.aggregate([
      {
        '$project': {
          'stats': 0,
          'statlineType': 0
        }
      }, {
        '$addFields': {
          'season': {
            '$year': '$gameDate'
          }
        }
      }, {
        '$match': {
          'season': currentSeason
        }
      }, {
        '$addFields': {
          'regSeason': {
            '$switch': {
              'branches': [
                {
                  'case': {
                    '$eq': [
                      '$season', currentSeason
                    ]
                  },
                  'then': {
                    '$gte': [
                      '$gameDate', regSeasonStart
                    ]
                  }
                }
              ]
            }
          }
        }
      }, {
        '$match': {
          '$expr': {
            '$and': [
              {
                '$eq': [
                  '$regSeason', true
                ]
              }
            ]
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
          '$expr': {
            '$in': [
              '$positions', [
                '1B', '2B', '3B', 'DH', 'OF', 'SS', 'C'
              ]
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
          },
          'season': {
            '$max': {
              '$year': '$gameDate'
            }
          }
        }
      }, {
        '$group': {
          '_id': {
            'mlbId': '$_id.mlbId',
            'pos': '$_id.pos',
            'season': '$season'
          },
          'posCount': {
            '$sum': '$inGameCount'
          }
        }
      }, {
        '$group': {
          '_id': {
            'mlbId': '$_id.mlbId',
            'season': '$_id.season'
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
                  '$$posObj.ct', 10
                ]
              }
            }
          },
          'maxPosition': {
            '$first': {
              '$filter': {
                'input': '$positionsLog',
                'as': 'posObj',
                'cond': {
                  '$and': [
                    {
                      '$gte': [
                        '$$posObj.ct', {
                          '$max': '$positionsLog.ct'
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }, {
        '$addFields': {
          'mlbId': '$_id.mlbId',
          'season': '$_id.season',
          'eligiblePositions': '$eligiblePositions.pos'
        }
      }, {
        '$project': {
          '_id': 0
        }
      }, {
        '$lookup': {
          'from': 'position_log',
          'let': {
            'mlbId': '$mlbId',
            'ssn': '$season'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$and': [
                    {
                      '$eq': [
                        '$mlbId', '$$mlbId'
                      ]
                    }, {
                      '$eq': [
                        '$season', '$$ssn'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          'as': 'outcoll'
        }
      }, {
        '$lookup': {
          'from': 'position_log',
          'let': {
            'lastSsn': {'$subtract': ['$season', 1]},
            'mlbId': '$mlbId'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$and': [
                    {
                      '$eq': [
                        '$mlbId', '$$mlbId'
                      ]
                    }, {
                      '$eq': [
                        '$season', '$$lastSsn'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          'as': 'lastSsnPos'
        }
      }, {
        '$addFields': {
          '_id': {
            '$first': '$outcoll._id'
          },
          'maxPosition': '$maxPosition.pos',
          'priorSeasonMaxPos': {
            '$first': '$lastSsnPos.maxPosition.pos'
          }
        }
      }, {
        '$project': {
          'outcoll': 0,
          'lastSsnPos': 0
        }
      }, {
        '$merge': {
          'into': 'position_log',
          'on': '_id',
          'whenMatched': 'replace',
          'whenNotMatched': 'insert'
        }
      }
    ])


    return position_log_records
  } catch(err) {

  }
}


  async _generatePositionLog(req, res, next) {

      try {

        const position_log_records = await this._genPositionLog();

      if (!position_log_records) {
        return res.status(400).send({message: 'No stats found.'});
      }
      return res.send({message: "Positions updated successfully"})

    } catch (err) {
      return res.status(500).send({message: err.message });
    }


  }

reroute() {
  router = this.route();
  router.get('/position_log/:id' , (...args) => this._updatePosLogForPlayer(...args));
  router.get('/position_log', (...args)=>this._generatePositionLog(...args));
  return router;
}

}

module.exports = StatlineController

