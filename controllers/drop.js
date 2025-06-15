/*jshint esversion: 8 */
const Drop = require('../models/draft').Drop;
const BaseController = require('./base.controller');

class DropController extends BaseController {

  constructor() {
    super(Drop, 'drops');
  }
}

module.exports = DropController

