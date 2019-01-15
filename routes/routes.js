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
router.get('/api/players/:id', function (req, res, next) {
  Player.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

// router.get("/api/players/:id", function (req, res) {
//   db.collection(PLAYERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
//     if (err) {
//       handleError(res, err.message, "Failed to find player");
//     } else {
//       res.status(200).json(doc);
//     }
//   });
// });

router.put("/api/players/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(PLAYERS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, {$set : updateDoc}, {upsert : true}, function(err, doc) {
    console.log(err);
    console.log(doc);
    
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});


router.delete("/api/players/:id", function(req, res) {
  db.collection(PLAYERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete player");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});




module.exports = router;