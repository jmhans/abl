const Roster = require('../models/roster');
const BaseController = require('./base.controller');

class RostersController extends BaseController {

  constructor() {
    super(Roster, 'rosters');
  }
}

module.exports = RostersController

