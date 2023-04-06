const Draft  = require('../models/draft').Draft;
const Draftpicks  = require('../models/draft').DraftPick;
const BaseController = require('./base.controller');
const AblRosterController = require('./abl.roster.controller');
var express = require('express');



var   router = express.Router();


class DraftController extends BaseController {

  constructor() {
    super(Draftpicks, 'draftpicks');
  }

  async _getOne(req, res, next) {
    // Overriding the default, which would use an "id" as a passed parameter. For this model, the "season" acts as the ID.
    try {
      const draft = await this.find({season: req.params.id});
      return res.send(draft);
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }

}




module.exports = DraftController

