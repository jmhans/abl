//const Player = require('../models/player');
var express = require('express');
var router = express.Router();

// routePath = api_prefix + resourceName.toLowerCase();
//     var modelName = inflect.singularize(resourceName);
//     var Model = mongoose.model(modelName);

class BaseController {
  constructor(model) {
    this.model = model
  }  
  
  //Simple version, without validation or sanitation
_get(req, res, next) {
  this.model.find(function(err, results) {
    if (err) return next(err);
    res.json(results);
  });
  }


_create(model) {
return( function(req, res, next) {
  this.model.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
})  
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
    router.get('/players', _get);
    router.post('/players', _create);
    router.get('/players/:id', _getOne);
    router.put('/players/:id', _update);
    router.delete('/players/:id', _delete);
    return router;
  }

}

module.exports = BaseController

