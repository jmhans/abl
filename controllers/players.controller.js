const Player = require('../models/player').Player;
const BaseController = require('./base.controller');

class PlayersController extends BaseController {

  constructor() {
    super(Player, 'players');
  }
}

module.exports = PlayersController

