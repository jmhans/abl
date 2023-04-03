const Draft  = require('../models/draft').Draft;
const Draftpicks  = require('../models/draftpicks').DraftPick;
const BaseController = require('./base.controller');
const AblRosterController = require('./abl.roster.controller');
var express = require('express');

const EventEmitter = require('events');
const Stream = new EventEmitter();

var   router = express.Router();


class DraftController extends BaseController {

  constructor() {
    super(DraftPick, 'draftpicks');
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

  async _makePick(req, res, next) {

    try {

      var result = await AblRosterController._addPlayerToTeamBackend(req.body.player, req.params.id, 'draft', req.body.effectiveDate);
      var dp = await this.model.create(req.body);
      Stream.emit('push', 'message', {msg: 'it works!', pick: dp});

      return res.send(result);

    } catch(err) {
      return res.status(500).send({message : err.message})
    }

  }

  _updateDraft(req, res) {
    response.writeHead(200, {
      'Content-Type' : 'text/event-stream',
      'Cache-Control':'no-cache',
      Connection: 'keep-alive',
        })
      Stream.on('push', function(event, data) {
      response.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
      })

  }



  reroute() {
    router = this.route();
    router.get('/refreshDraft', (...args)=>this._updateDraft(...args))
    return router;
  }
}




module.exports = DraftController

