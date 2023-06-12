/*jshint esversion: 8 */
const Skip = require('../models/draft').Skip;
const BaseController = require('./base.controller');


class SkipController extends BaseController {

  constructor() {
    super(Skip, 'skips');
  }


}




module.exports = SkipController

