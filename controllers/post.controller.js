const Post = require('../models/post');
const BaseController = require('./base.controller');
class PostController extends BaseController {

  constructor() {
    super(Post, 'posts');
  }



  }

module.exports = PostController






