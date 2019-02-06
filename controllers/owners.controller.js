const Owner = require('../models/owner');
const BaseController = require('./base.controller');

class OwnersController extends BaseController {

  constructor() {
    super(Owner.Owner, 'owners');
  }
  
}

class TeamsController extends BaseController {
  constructor() {
    super(Owner.Team, 'teams')
  }

}

module.exports = { OwnersController: OwnersController, TeamsController: TeamsController}






