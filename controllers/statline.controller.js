const Statline = require('../models/statline');
const BaseController = require('./base.controller');

class StatlineController extends BaseController {

  constructor() {
    super(Statline, 'statlines');
  }
 
  
}

module.exports = StatlineController

