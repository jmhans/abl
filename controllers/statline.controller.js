const Statline = require('../models/statline').Statline;
const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();
const ablConfig = require('../server/ablConfig');

function minifyJSON(obj) {
return Object.keys(obj)
.filter(function(key) {
  return obj[key] !== 0
})
.reduce(function(out, key) {
  out[key] = obj[key]
  return out
}, {})
}


function shortenStats(statline) {
  let outputObj = {batting: minifyJSON(statline.batting), fielding: {e: statline.fielding.errors}}

return outputObj

}





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

    console.log(`Updating stats for ${plyr.person.fullName}`)

    if (plyr.allPositions) {

    var shortPositions = plyr.allPositions.map((pos) => {return pos.abbreviation;})
    const resumedGame = !!gm.resumedFrom
    const originalDate = gm.resumedFrom ? gm.resumedFrom : gm.gameDate
    let playedDate = (new Date(new Date(gm.gameDate) - (new Date(gm.gameDate)).getTimezoneOffset() * 60000)).toISOString().substring(0, 10)
    // this is the yyyy-MM-dd formatted string of the game time in local time zone.


//    let a = (new Date(new Date(originalDate) - (new Date(originalDate)).getTimezoneOffset() * 60000)).toISOString().substring(0, 10)



       var _statline = {
                mlbId: plyr.person.id,
                gameDate: gm.gameDate,
                gamePk: gm.gamePk,
                stats: shortenStats(plyr.stats),
                positions: shortPositions,
                statlineType: gm.status.detailedState,
                ablDate: playedDate
              };

      try {
        if (resumedGame) {
          var query = {
            'mlbId': plyr.person.id.toString(),
            'gamePk': gm.gamePk.toString(),
            'ablDate': {$lt: playedDate}
          }

          const docs = await this.model.find(query);
          if (docs.length > 0) {
            console.log(`Reducing stats for ${docs.length} prior records`)
            // Doc already exist for this game for a prior ablDate. This could be a suspended game situation. Modify the 'new' stats to reflect only those that happened after the prior document, then create new doc.
             _statline.stats = await this._getStatlineDiff(shortenStats(plyr.stats), docs)

          }
        }

        var query = {
            'mlbId': plyr.person.id.toString(),
            'gamePk': gm.gamePk.toString(),
            //'gameDate': new Date(originalDate),
            'ablDate':playedDate
        }
        console.log(`Sending to DB now`)
        const doc2 = await this.model.updateMany(query, _statline, { upsert: true });
        console.log(`Successfully updated ${plyr.person.fullName} for date ${gm.gameDate}`)
        //console.log(doc2)
          return doc2;


      } catch (err) {
        console.error(`Error in _updateStatline:${err}`);
      }
}

  }

  async _getStatlineDiff(fullStat, partialStat) {
    //console.log(partialStat)
    var partials = partialStat.reduce((all, cur) => {
      Object.keys(cur.stats).forEach((cat)=> {
        if (!all[cat]) {
          all[cat] = {}
        }
        Object.keys(cur.stats[cat]).forEach((prop)=> {
          if (typeof(cur.stats[cat][prop] == "number")) {
            if (prop == 'gamesPlayed') {
              all[cat][prop] = cur.stats[cat][prop]
            } else  {
              all[cat][prop] = cur.stats[cat][prop] + (all[cat][prop] || 0)
            }
          }
        })
      })
        return all
      }, {})

    var ret = {batting: {}, fielding: {}, pitching: {}}
    if (fullStat) {
      Object.keys(fullStat).forEach((cat)=> {
        Object.keys(fullStat[cat]).forEach((prop)=> {
          if (typeof(fullStat[cat][prop]) == "number") {
              if (prop == 'gamesPlayed') {
                ret[cat][prop] = fullStat[cat][prop]
              } else {
                ret[cat][prop] = fullStat[cat][prop] - (partials[cat][prop] || 0)
              }

            }
        })
      })

      return ret
    }
  }

  async _updatePosLogForPlayer(req, res, next) {
    try {
      const slDoc = await this.model.findById(req.params.id).exec();
      const mlbId = slDoc.mlbId
      const currentSeason = new Date(slDoc.gameDate).getFullYear() || 2024;
      const regSeasonStart = new Date('2024-03-28T00:00:00Z')

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

    var currentSeason = 2024;
    var regSeasonStart = new Date('2024-03-28T00:00:00Z')

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

