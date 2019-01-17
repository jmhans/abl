const Player = require('../models/player');

//Simple version, without validation or sanitation
exports.players_get = function(req, res, next) {
  Player.find(function(err, players) {
    if (err) return next(err);
    res.json(players);
  });
  };


_create = function(model) {
return( function(req, res, next) {
  model.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
})  
}

exports.player_create = _create(Player);
// exports.player_create = function(req, res, next) {
//   Player.create(req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// };

exports.player_getOne = function (req, res, next) {
  Player.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
};

exports.player_update = function(req, res, next) {
  var options = {new : true, upsert : true};
  Player.findByIdAndUpdate(req.params.id, req.body, options,  function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
};

exports.player_delete = function(req, res, next) {
  Player.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
};