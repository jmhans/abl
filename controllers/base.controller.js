


class BaseController{

  /**
    @param model Mongoose model
  */
  constructor(model){
    this.model = model;
    this.modelName = model.modelName.toLowerCase();
  }
  
  route() {
    var express = require('express');
    const router = new express.Router()
    router.get("/", (req, res, next) => {
      this.model
        .find(function(err, players) {
        if (err) return next(err);
        res.json(players);
      });
      });


    router.post("/", (req, res, next) => {
      this.model.create(req.body, function (err, post) {
        if (err) return next(err);
        res.json(post);
      });
    });

    router.get('/:id', (req, res, next)=> {
      this.model
        .findById(req.params.id, function (err, post) {
        if (err) return next(err);
        res.json(post);
      });
    });

    router.put('/:id', (req, res, next) => {
      var options = {new : true, upsert : true};
      this.model.findByIdAndUpdate(req.params.id, req.body, options,  function (err, post) {
        if (err) return next(err);
        res.json(post);
      });
    });

    router.delete('/:id', (req, res, next)=> {
      this.model.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) return next(err);
        res.json(post);
      });
    });
  }
 
}

module.exports = BaseController;