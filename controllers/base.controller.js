//const Player = require('../models/player');
var express = require('express');
var router = express.Router();

// routePath = api_prefix + resourceName.toLowerCase();
//     var modelName = inflect.singularize(resourceName);
//     var Model = mongoose.model(modelName);

class BaseController {
  constructor(model) {
    this.model = model
    console.log("BaseController constructor called");
    console.log("Model:" + this.model.find(function(err, results) {
      if (err) return next(err);
      console.log(results);
    }));
  }  
  
  //Simple version, without validation or sanitation
_get(req, res, next) {
  this.model.find(function(err, results) {
    if (err) return next(err);
    res.json(results);
  });
  }


_create(req, res, next) {
  this.model.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_getOne(req, res, next) {
  this.model.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_update (req, res, next) {
  var options = {new : true, upsert : true};
  this.model.findByIdAndUpdate(req.params.id, req.body, options,  function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_delete(req, res, next) {
  this.model.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}
  
  
  route() {
    router.get('/players', (...args) => this._get(...args));
    router.post('/players', (...args) => this._create(...args));
    router.get('/players/:id', (...args) => this._getOne(...args));
    router.put('/players/:id', (...args) => this._update(...args));
    router.delete('/players/:id', (...args) => this._delete(...args));
    return router;
  }

}

module.exports = BaseController

