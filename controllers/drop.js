/*jshint esversion: 8 */
const Drop = require('../models/draft').Drop;
const BaseController = require('./base.controller');
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
var express = require('express');

var   router = express.Router();

class DropController extends BaseController {

  constructor() {
    super(Drop, 'drops');
  }



  async _processDrops (req, res, next) {

    try {
      let output = [];
      let items = await this.model.find({})
      for (let p= 0; p<items.length; p++) {
        let popMlbPlayer = await myAblRoster._dropPlayerBackend(items[p].player, items[p].ablTeam)
          output = [...output, popMlbPlayer]
        await this.model.remove({ _id: items[p]._id })
      }
      res.send(output)


    } catch(err) {
      return res.status(500).send({message : err.message})
    }

}

reroute() {
  router = this.route();
//    router.get('/processDraftResults', (...args)=>this._processDraftResults(...args));

  router.get('/process_drops', (...args)=>this._processDrops(...args));

  return router;
}

}

module.exports = DropController

