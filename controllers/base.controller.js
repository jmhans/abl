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
      console.log(json(results));
    }));
  }  
  
  //Simple version, without validation or sanitation
_get(req, res, next) {
  return this.model.find(function(err, results) {
    if (err) return next(err);
    res.json(results);
  });
  }


_create(req, res, next) {
  return this.model.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_getOne(req, res, next) {
  return this.model.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_update (req, res, next) {
  var options = {new : true, upsert : true};
  return this.model.findByIdAndUpdate(req.params.id, req.body, options,  function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}

_delete(req, res, next) {
  return this.model.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
}
  
  
  route() {
    router.get('/players', this._get);
    router.post('/players', this._create);
    router.get('/players/:id', this._getOne);
    router.put('/players/:id', this._update);
    router.delete('/players/:id', this._delete);
    return router;
  }

}

module.exports = BaseController

