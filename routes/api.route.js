var express = require('express');
var router = express.Router();
//const owners_controller = require('../controllers/owners.controller');
const players_controller = require('../controllers/players.controller');

const generic_api_controller = require('../controllers/generic.controller');


//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

// a simple test url to check that all of our files are communicating correctly.
// router.get('/owners', owners_controller.owners_get);
// router.post('/owners', owners_controller.owner_create);
// router.get('/owners/:id', owners_controller.owner_getOne);
// router.put('/owners/:id', owners_controller.owner_update);
// router.delete('/owners/:id', owners_controller.owner_delete);

router.get('/players', players_controller.players_get);
router.post('/players', players_controller.player_create);
router.get('/players/:id', players_controller.player_getOne);
router.put('/players/:id', players_controller.player_update);
router.delete('/players/:id', players_controller.player_delete);


import { OwnersController
			 }											from './controllers/owners.controller';

router.use('/owners', new OwnersController().route());


module.exports = router;