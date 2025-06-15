/*jshint esversion: 8 */

const Draft  = require('../models/draft').Draft;
const Draftpicks  = require('../models/draft').DraftPick;
const BaseController = require('./base.controller');
var AblRosterController = require('./abl.roster.controller');
var myAblRoster = new AblRosterController()
const StandingsController = require('./standings.controller');
var myStandings = new StandingsController();
const Lineup = require('./../models/lineup').Lineup;
const CurrentLineupModel=require('./../models/lineup').CurrentLineups;


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
      const draft = await this.model.find({season: req.params.id});
      return res.send(draft);
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }

  _get(req, res, next) {
    console.log(`getting draft picks: ${req.query}`)
    this.model.find(req.query).populate('ablTeam player').exec(function(err, results) {
      if (err) return next(err);
      res.json(results);
    });
  }

  async _update (req, res, next) {

    try {
      var options = {new : false, upsert : true};
      let resp = await this.model.findByIdAndUpdate(req.params.id, req.body, options)
      if (resp.status != 'Complete' && req.body.status == 'Complete') {
        // A new pick was just submitted. Update current and set expiration timer.
        this._resetCurrentPick()
      }
      return res.send(resp);

    } catch (err) {
      return res.status(500).send({message: err.message})
    }
  }

  async _resetCurrentPick() {
    let minutes_per_pick = 60;

    var t = new Date();
    t.setSeconds(t.getSeconds() + minutes_per_pick * 60);
    let next_pick = await this.model.findOneAndUpdate({
      season: "2025",
      draftType: "supp_draft",
      status: { $in: ["Pending", "Current"] }
}, {"$set": {"status": "Current", "expiration": t.toISOString()}}, {sort: {"pickNumber": 1}})


    //this._autoSkipPick(next_pick._id, minutes_per_pick * 60 * 100)

    return next_pick
  }


  async _autoSkipPick(pickId, waitTime) {
    try {
      await new Promise(resolve => setTimeout(resolve, waitTime))
      let lookupPick = await this.model.findById(pickId)
      if (lookupPick.status != 'Complete') {
        let updated_pick = await this.model.findByIdAndUpdate(pickId, {"$set": {"status": "Skipped"}})
      }
      if (lookupPick.status == 'Current') {
        this._resetCurrentPick()
      }


    }catch (err) {

    }
  }


  _setupSuppDraft(req, res, next) {

  }



  async _processDraftPicks(req, res, next) {
    try {
      let allDraftPicks = await this.model.find({"season": "2025", "draftType": "draft"}).exec()
      console.log(allDraftPicks)
      for (let p=0; p<allDraftPicks.length; p++) {
       let addDude = myAblRoster._addPlayerToTeamBackend(allDraftPicks[p].player, allDraftPicks[p].ablTeam , allDraftPicks[p].draftType, new Date("2025-04-08T17:00:00Z"), true)
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






  async _generateDraftPicks(req, res, next) {

try {
    let onePickDraftRounds = 6
    let multiPickDraftRounds = 0
    let picksPerMultiRound = 0
    let totalPicks = 27
    let snake = false

    console.log(`Generating Draft`)
    let standings = await myStandings._getBackend({"asOfDate": "2025-06-14"})

    standings.sort((a,b)=> {
      let wpct = (o)=> {return o.w/o.g}
      if (wpct(a) == wpct(b)) {
        return a.avg_runs - b.avg_runs
      }
      return (a.w / a.g) - (b.w / b.g)}
      )

      let draftOrder = standings.map((d)=> {
        const {tm, ...otherProps} = d
        return tm
      })

      let currentLineups = await CurrentLineupModel.find()

      let roster_lengths = currentLineups.reduce((acc, cur)=> {
        let origRoster = cur.roster.filter((p)=> p.player.ablstatus.acqType == 'draft');
        return [...acc, {team: cur.ablTeam.toString(), roster_size: origRoster.length}]
      }, [])

      console.log(roster_lengths)
      let draftRounds = []

      for (let i=0; i<onePickDraftRounds; i=i+1) {
        for (let tm = 0; tm<draftOrder.length; tm++){
          let team_roster_length =roster_lengths.find((rl)=> {return rl.team == draftOrder[tm]._id})?.roster_size

          // Create the pick for the current team in the current round
          let pick = {
            ablTeam: draftOrder[tm]._id
            ,season: "2025"
            , draftType: "supp_draft"
            ,pickNumber: i*draftOrder.length+((snake && i % 2 === 1) ? draftOrder.length - tm : tm+1)
            ,round: i+1
            ,pickInRound: tm+1
            ,status: (team_roster_length+i+1 <=totalPicks ) ? 'Pending' : 'Not Allowed'
          }
        draftRounds.push(pick)
        }
      }

      let newPicks = await this.model.insertMany(draftRounds)
      //res.json(newPicks);
      return res.json(newPicks)
    } catch (err) {

      return next(err)

  }
}


async _updateCurrentPick(req, res, next) {
  try {

    let newCurrentPick = await this._resetCurrentPick()
    return res.json(newCurrentPick)

  }catch (err) {
    return res.status(500).send({message: err.message});
  }
}



  _setupSuppDraft(req, res, next) {

  }


  reroute() {
    router = this.route();
//    router.get('/processDraftResults', (...args)=>this._processDraftResults(...args));
    router.get('/processAllDraftPicks', (...args)=>this._processDraftPicks(...args));
    router.get('/create_supp', (...args)=>this._generateDraftPicks(...args));
    router.get('/getnext', (...args)=>this._updateCurrentPick(...args));

    return router;
  }

}




module.exports = DraftController

