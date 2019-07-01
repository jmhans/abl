const Statline = require('../models/statline');
const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();
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
  
    
//   route() {
//     router.get("/statlines/:mlbId", (...args)=> this._getStatsForPlayer(...args))
//     //router = super.route();
    
//     return router;
//   }
  
}

module.exports = StatlineController

