const Owner = require('../models/owner');
const BaseController = require('./base.controller');

class OwnersController extends BaseController {

  constructor() {
    super(Owner, 'owners');
  }
}

module.exports = OwnersController






