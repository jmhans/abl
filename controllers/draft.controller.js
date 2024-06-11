/*jshint esversion: 8 */

const Draft  = require('../models/draft').Draft;
const Draftpicks  = require('../models/draft').DraftPick;
const BaseController = require('./base.controller');
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
const Lineup = require('./../models/lineup').Lineup;

var express = require('express');

var   router = express.Router();

const ObjectId = require('mongoose').Types.ObjectId;

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

  _get(req, res, next) {
    this.model.find(req.query).populate('player').exec(function(err, results) {
      if (err) return next(err);
      res.json(results);
    });
  }

  _setupSuppDraft(req, res, next) {

  }



  async _processDraftPicks(req, res, next) {
    try {
      let allDraftPicks = await this.model.find({"season": "2024", "draftType": "supp_draft"}).exec()
      console.log(allDraftPicks)
      for (let p=0; p<allDraftPicks.length; p++) {
       let addDude = myAblRoster._addPlayerToTeamBackend(allDraftPicks[p].player, allDraftPicks[p].ablTeam , allDraftPicks[p].draftType, new Date("2024-06-11T17:00:00Z"), true)
       console.log(addDude.name)
      }
      return res.send({success: true, addCount: allDraftPicks.length});


    } catch(err) {
      return res.status(500).send({message: err.message})
    }
   }

  async _processDraftResults(req, res, next) {

    try {
      let draftRes = await this.model.aggregate(
        [
          {
            $group:
              {
                _id: "$ablTeam",
                roster: {
                  $push: {'player': "$player", 'position': "$position"},
                },
                draftDate: {$min: "$pickTime"}
              },
          },
        ])

        for (let i=0; i<draftRes.length; i++){
          var teamId =draftRes[i]._id
          var teamRoster = draftRes[i].roster


          for (let pick=0; pick<teamRoster.length; pick++) {
            let thingy = await myAblRoster._updatePlayerRecBackend(teamRoster[pick].player, teamId, 'draft', draftRes[i].draftDate )
          }

          var postDatedLineups = await Lineup.find({ablTeam: teamId, effectiveDate: {$gte: draftRes[i].draftDate}})
            if (postDatedLineups.length > 0) {
              // Uh oh. Need to delete them all.
              Lineup.deleteMany({ablTeam: teamId, effectiveDate: {$gte: draftRes[i].draftDate}})
            }
            let newLineup = await Lineup.create({
              ablTeam: new ObjectId(teamId),
              roster: teamRoster.map((rr, index)=> {
                return {player: rr.player, lineupPosition: rr.position, rosterOrder: index+1}
              }),
              effectiveDate: draftRes[i].draftDate
            })


        }
        return res.send("Draft Results Imported!");
    } catch (err) {
      console.error(`Error in _processDraftResults: ${err}`);
      return res.status(500).send({message: err.message});

    }

  }
  reroute() {
    router = this.route();
//    router.get('/processDraftResults', (...args)=>this._processDraftResults(...args));
    router.get('/processAllDraftPicks', (...args)=>this._processDraftPicks(...args));

    return router;
  }

}




module.exports = DraftController

