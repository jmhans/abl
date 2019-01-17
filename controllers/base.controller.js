var express = require('express');
var router = express.Router();

export default class BaseController{

  /**
    @param model Mongoose model
    @param key primary key of the model that will be used for searching, removing
    and reading
  */
  constructor(model){
    this.model = model;
    this.modelName = model.modelName.toLowerCase();
  }
  
  route() {


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