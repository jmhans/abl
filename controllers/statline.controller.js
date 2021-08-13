const Statline = require('../models/statline');
const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();
const ablConfig = require('../server/ablConfig');


// function _isPositionPlayer(plyr) {
  
//   if (plyr.allPositions) { 
    
//     nonPitcherPosList = plyr.allPositions.filter((posRec) => {return posRec.abbreviation != 'P'});

//     return (nonPitcherPosList.length > 0);
//   }
//   return false;
// }


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
                gameDate: gm.gameDate, //gm.officialDate ? (new Date(gm.officialDate + "T12:00:00")).toISOString() : gm.gameDate, 
                gamePk: gm.gamePk, 
                stats: plyr.stats,
                positions: shortPositions,
                statlineType: gm.status.detailedState
              };
      try {
        const doc = await this.model.findOne(query);
        if (doc) {
          // One already exists. This could be a suspended game situation. Modify the 'new' stats to reflect only those that happened after the prior document, then create new doc. 
          
          if (doc.gameDate != gm.gameDate) {
            // They have stats from the original date. Find the diff for the new date.  
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
  
  
  async _getStatsForDate(req, res, next) {

    try {
      
       const day = new Date(req.params.dt + "T12:00:00Z")
       var nextDay = new Date(day.toISOString());
       nextDay.setDate(day.getDate() +1)
      
      var stats = await this.model.aggregate([
          {
            '$match': {
              'gameDate': {
                '$gte': day, 
                '$lt': nextDay
              }
            }
          }, {
            '$lookup': {
              'from': 'players', 
              'localField': 'mlbId', 
              'foreignField': 'mlbID', 
              'as': 'player'
            }
          }, {
            '$addFields': {
              'player': {
                '$first': '$player'
              }, 
              'stats': { '$ifNull': [ "$updatedStats", "$stats" ] }
            }
          }
        ])

      if (!stats) {
        return res.status(400).send({message: 'No stats found.'});
      }
      return res.send(stats)

    } catch (err) {
      return res.status(500).send({message: err.message });
    }
  }

    
  
    
//   route() {
//     router.get("/statlines/:mlbId", (...args)=> this._getStatsForPlayer(...args))
//     //router = super.route();
    
//     return router;
//   }
  
}

module.exports = StatlineController

