var express = require('express');
var router = express.Router();
var mongoUtil = require( '../models/mongoUtil');
var Player = require('../models/player.js');

//var db = mongoUtil.getDb();

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

const owners_controller = require('../controllers/owners.controller');

// a simple test url to check that all of our files are communicating correctly.
router.get('/api/players2/test', owners_controller.test);
router.post('/api/players2/create', owners_controller.owner_create);

router.get("/api/players", function(req, res, next) {
  Player.find(function(err, players) {
    if (err) return next(err);
    res.json(players);
  });
  });

router.post("/api/players", function(req, res, next) {
  Player.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

router.get('/api/players/:id', function (req, res, next) {
  Player.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* UPDATE PRODUCT */
router.put('/api/players/:id', function(req, res, next) {
  Player.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE PRODUCT */
router.delete('/api/players/:id', function(req, res, next) {
  Player.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


module.exports = router;