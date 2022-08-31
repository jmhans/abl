/*jshint esversion: 8 */

const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();

const AblGame = require('../models/Game');
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
var StatlineController = require('./statline.controller');
const Statline = require('../models/statline');

const ObjectId = require('mongoose').Types.ObjectId;


class PlayoffController extends BaseController{

    constructor() {
      super(AblGame, 'games');
    }






reroute() {
  router = this.route();
  return router;
}


  }


module.exports = PlayoffController
