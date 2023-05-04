const Post = require('../models/post');
const BaseController = require('./base.controller');
class PostController extends BaseController {

  constructor() {
    super(Post, 'posts');
  }


  _get(req, res, next) {
    this.model.find().populate('replies').exec(function(err, results) {
      if (err) return next(err);
      res.json(results);
    });
    }
  }

module.exports = PostController






