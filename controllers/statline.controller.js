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
    if (ablConfig._isPositionPlayer(plyr)) {
    var shortPositions = plyr.allPositions.map((pos) => {return pos.abbreviation;})
      var query = {
        'mlbId': plyr.person.id, 
        'gameDate': gm.gameDate, 
        'gamePk': gm.gamePk, 
        
      }
      
       var _statline = {
                mlbId: plyr.person.id,
                gameDate: gm.gameDate, 
                gamePk: gm.gamePk, 
                stats: plyr.stats,
                positions: shortPositions
              };
      try {
        const doc = await this.model.findOneAndUpdate(query, _statline, { upsert: true });
        return doc;
      } catch (err) {
        console.error(`Error in _updateStatline:${err}`);
      }


    }  
  }
  
    
//   route() {
//     router.get("/statlines/:mlbId", (...args)=> this._getStatsForPlayer(...args))
//     //router = super.route();
    
//     return router;
//   }
  
}

module.exports = StatlineController

