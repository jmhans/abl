var express = require('express');
var router = express.Router();

//const players_controller = require('../controllers/players.controller');

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var PlayersController = require('../controllers/players.controller');
var OwnersController = require('../controllers/owners.controller').OwnersController;
var TeamsController = require('../controllers/owners.controller').TeamsController;
var RostersController = require('../controllers/rosters.controller');
var StatlineController = require('../controllers/statline.controller');
var AblRosterController = require('../controllers/abl.roster.controller').altABLRosterController;
//var MLBAPI = require('../controllers/mlbapi.controller');

router.use(new PlayersController().route());
router.use(new OwnersController().route());
router.use(new RostersController().route());
router.use(new TeamsController().route());
router.use(new StatlineController().route());
router.use(new AblRosterController().route());
//router.use(new MLBAPI().route());


module.exports = router;