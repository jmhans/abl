var express = require('express');
var router = express.Router();

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});


router.get("/api/players/:id", function (req, res) {
  db.collection(PLAYERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to find player");
    } else {
      res.status(200).json(doc);
    }
  });
});

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