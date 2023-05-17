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
var AttestationController = require('../controllers/game.attestation.controller');
var AblRosterController = require('../controllers/abl.roster.controller');
var MLBAPI = require('../controllers/mlbapi.controller').altMlbApiController;
//var MLBAPI2 = require('../controllers/mlbapi.controller').mlbAPI;
var Standings = require('../controllers/standings.controller');
var mlbEvt = require('../controllers/mlbEventHandler').mlbEventHandler
var AblGameController= require('../controllers/abl.game.controller');
var DraftController = require('../controllers/draft.controller');
var PostController = require('../controllers/post.controller');


router.use(new PlayersController().reroute());
router.use(new OwnersController().route());
router.use(new RostersController().route());
router.use(new TeamsController().route());
router.use(new StatlineController().reroute());
router.use(new AttestationController().route());
router.use(new AblRosterController().reroute());
router.use(new MLBAPI().route());
router.use(new Standings().route());
router.use(new mlbEvt().route())
router.use(new AblGameController().reroute());
router.use(new DraftController().reroute());
router.use(new PostController().route());


module.exports = router;
