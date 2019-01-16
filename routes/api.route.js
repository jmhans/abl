var express = require('express');
var router = express.Router();
const owners_controller = require('../controllers/owners.controller');
const players_controller = require('../controllers/players.controller');

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

// a simple test url to check that all of our files are communicating correctly.
router.get('/owners', owners_controller.test);
router.post('/owners', owners_controller.owner_create);
router.get('/players', players_controller.player_get);
router.post('/players', players_controller.player_create);



router.get('/players/:id', players_controller.player_getOne);

/* UPDATE PRODUCT */
router.put('/players/:id', players_controller.player_update);

/* DELETE PRODUCT */
router.delete('/players/:id', players_controller.player_delete);

module.exports = router;