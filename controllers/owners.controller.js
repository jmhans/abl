const Owner = require('../models/owner');

//Simple version, without validation or sanitation
exports.owners_get = function(req, res, next) {
  Player.find(function(err, owners) {
    if (err) return next(err);
    res.json(owners);
  });
  };


exports.owner_create = function(req, res, next) {
  Owner.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
};
