var express = require('express');
var router = express.Router();

//const players_controller = require('../controllers/players.controller');

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var PlayersController = require('../controllers/players.controller');
var OwnersController = require('../controllers/owners.controller');
var RostersController = require('../controllers/rosters.controller');

router.use(new PlayersController().route());
router.use(new OwnersController().route());
router.use(new RostersController().route());

module.exports = router;