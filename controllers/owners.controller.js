const BaseController = require('./base.controller');
const Owner = require('../models/owner');

// //Simple version, without validation or sanitation
// exports.owners_get = function(req, res, next) {
//   Owner.find(function(err, owners) {
//     if (err) return next(err);
//     res.json(owners);
//   });
//   };


// exports.owner_create = function(req, res, next) {
//   Owner.create(req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// };

// exports.owner_getOne = function (req, res, next) {
//   Owner.findById(req.params.id, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// };

// exports.owner_update = function(req, res, next) {
//   var options = {new : true, upsert : true};
//   Owner.findByIdAndUpdate(req.params.id, req.body, options,  function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// };

// exports.owner_delete = function(req, res, next) {
//   Owner.findByIdAndRemove(req.params.id, req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// };

class OwnersController extends BaseController{
  constructor(){
    super(Owner);
  }
}

module.exports = new OwnersController()