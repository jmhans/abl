/*jshint esversion: 8 */

const request = require('request');
const BaseController = require('./base.controller');

var express = require('express');
var router = express.Router();


const AblRosterRecord = require('./../models/owner').AblRosterRecord;
const AblTeam = require('./../models/owner').AblTeam;
const MlbPlayer = require('./../models/player').Player;
const Lineup = require('./../models/lineup').Lineup;

const ObjectId = require('mongoose').Types.ObjectId;

class ABLRosterController extends BaseController{

  constructor() {
    super(Lineup, 'lineups');
  }


  async _getGame(gmPk) {

    try {
      const response = await this.mlbStats.getGameBoxscore({
        pathParams: {
          gamePk: gmPk
        }
      });
      return response.data;
    } catch (err) {
      console.error(`Error in _getGame: ${err}`);
    }
  }

  async _getLineup(req, res, next) {
    try {
      const lineup = await this._getLineupForTeam(req.params.id);
      return res.send(lineup);
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }
  
  async _getLineupForTeam(tm) {
    try {
      const lineup = await Lineup.findOne({ ablTeam: new ObjectId(tm) }); 
      const orgLineup = await this._organizeLineup(lineup);
      return orgLineup
      
    } catch(err) {
      console.error(`Error in _getLineupForTeam: ${err}`)
    }
  }
  
  async _getRosterForTeamAndDate(teamId, gmDate) {
    try {
      
      var atomicLineup = await Lineup.aggregate(
      [{
        '$match': {
          'ablTeam': new ObjectId(teamId),
          'effectiveDate': {
            '$lte': this.getRosterDeadline(gmDate)
          }
        }
      }, {
        '$sort': {
          'effectiveDate': -1
        }
      }, {
        '$limit': 1
      }, {
        '$unwind': {
          'path': '$roster',
          'preserveNullAndEmptyArrays': false
        }
      }, {
        '$lookup': {
          'from': 'players',
          'localField': 'roster.player',
          'foreignField': '_id',
          'as': 'player'
        }
      }, {
        '$unwind': {
          'path': '$player',
          'preserveNullAndEmptyArrays': false
        }
      }, {
        '$group': {
          '_id': '$_id',
          'roster': {
            '$push': {
              'player': '$player',
              'lineupPosition': '$roster.lineupPosition',
              'rosterOrder': '$roster.rosterOrder'
            }
          },
          'effectiveDate': {
            '$first': '$effectiveDate'
          },
          'ablTeam': {
            '$first': '$ablTeam'
          }
        }
      }])
      
      if (atomicLineup) {
        
        //console.log(atomicLineup)
       
        return atomicLineup[0]
      } else {
        console.log("didn't find a lineup");
      }
      
    } catch (err) {
      console.error(`Error in _getRosterForTeamAndDate:${err}`);
    }

  }
  
  
  
  
  async _organizeLineup(lineup) {
      var populatedLineup = await lineup.populate('roster.player priorRosters.roster.player').execPopulate(); 
      if (populatedLineup.priorRosters) {
        populatedLineup.priorRosters.sort((a,b)=> {
          return (new Date(b.effectiveDate) - new Date(a.effectiveDate))
        })
      }
      
      return populatedLineup;    
  }
  
  async _getLineupById(id) {
    try {
      const lineup = await Lineup.findById(new ObjectId(id)); 
      const orgLineup = await this._organizeLineup(lineup);
      return orgLineup

    } catch(err) {
      console.error(`Error in _getLineupForTeam: ${err}`)
    }
  }
  
  
  async _getLineupForTeamAndDate(req, res, next) {
    try {
      const lineup = await this._getLineupForTeam(req.body.id);
      const gmDt = new Date(req.params.dt)
      
      if (lineup.effectiveDate < gmDt) {
        return res.status(200).send(lineup);
      } else { 
        if (lineup.priorRosters.length >0) {
          var sortedPR = lineup.priorRosters.sort((a,b)=> {return (new Date(b.effectiveDate) - new Date(a.effectiveDate))});
          for (s = sortedPR.length - 1; s>=0; s--) {
            if (sortedPR[s].effectiveDate < gmDt) {
              return res.status(200).send(sortedPR[s]);
            }  
          }
        } else {
          return res.status(400).send({message: 'No lineup found for that date.'})
        }
      }
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }
  
    
  async _getLineupForTeamAndDate2(req, res, next) {
    try {
      const tm = req.params.id; //await this._getLineupForTeam(req.body.id);
      const gmDt = new Date(req.params.dt)
      
      const lineup = await this._getRosterForTeamAndDate(tm, new Date(gmDt))
      
      if (lineup) {
        return res.status(200).send(lineup)
      }
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }
  
  
  
  async _newUpdateLineup(req, res, next) {
    try {
      var LineupRec = await this._getLineupById(req.params.id);
      if (LineupRec) {
        var updateRecord;
        
        if (!req.body._id) {
          // Create a new lineup rec within the existing one & shift the current to the prior list
        
          var priorLineupRec = {
              effectiveDate: LineupRec.effectiveDate,
              roster: LineupRec.roster, 
              _id: LineupRec._id
            }
          LineupRec.priorRosters.push(priorLineupRec)
          LineupRec.effectiveDate = req.body.effectiveDate;
          LineupRec.roster = req.body.roster;
          
        } else {
          // Update an existing roster record within the current Lineup record. 
          
          if (req.body._id == LineupRec._id) {
            // Updating the active roster record. 
            LineupRec.effectiveDate = req.body.effectiveDate;
            LineupRec.roster = req.body.roster;

          } else {
            // Updating a prior roster record.
            updateRecord = LineupRec.priorRosters.find((pr) => {
              return pr._id == req.body._id
            });

            updateRecord.effectiveDate = req.body.effectiveDate;
            updateRecord.roster = req.body.roster;
          }

        }
      } else {
        var ablTeam = await AblTeam.findById(req.body.ablTeamId);
        const LineupRec = new Lineup({
          ablTeam: ablTeam._id,
          roster: req.body.roster,
          effectiveDate: new Date(),
          priorRosters: []
        });
      }

      var savedLineupRec = await LineupRec.save();
      var populatedLineupRec = await LineupRec.populate('roster.player priorRosters.roster.player').execPopulate();
      return res.send(populatedLineupRec);

    } catch (err) {
      return res.status(500).send({
        message: err.message
      });
    }
  }
  
  
  getRosterDeadline(dt) {
    
        var noonLocalVal = new Date(dt.toISOString().substr(0, 10)+"T12:00:00")
        
        var deadlineAdjCompare = new Date(noonLocalVal.toLocaleString('en-US', {
          timeZone: "America/Chicago"
        }));

        // then invdate will be 07:00 in Toronto
        // and the diff is 5 hours
        var diff = noonLocalVal.getTime() - deadlineAdjCompare.getTime();

        // so 12:00 in Toronto is 17:00 UTC
        var deadlineUTC = new Date(noonLocalVal.getTime() + diff)  
        // UTC version of the date
        
        if (deadlineUTC < dt) {
            deadlineUTC.setDate(deadlineUTC.getDate() +1)
        }
        return deadlineUTC;
    
  }
  
  async _update (req, res, next) {
    try {
      var options = {new : true, upsert : true, useFindAndModify: false};
      var rosterDeadline = this.getRosterDeadline(req.params.dt ? new Date(req.params.dt) : new Date() )
      var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
      //var ablTeam = await AblTeam.findById(req.body.ablTeamId);
      
      // There can be only 1 roster per gameDate - defined as noon on the day prior to the game through noon on the game day (US CT).
      var query = {ablTeam: ObjectId(req.params.id), effectiveDate: {$gt: yesterdayDeadline, $lte: rosterDeadline}}
      
      var updatedRec = await this.model.findOneAndUpdate(query, {
        ablTeam: ObjectId(req.params.id),
        roster: req.body.roster,
        effectiveDate: rosterDeadline
      }, options).exec()
      if (updatedRec) {
        var populated = await updatedRec.populate('roster.player priorRosters.roster.player').execPopulate()
        res.json(populated)
      }
      } catch (err) {
            console.log(err);
          }


  }

  async _addPlayerToTeamAllFutureRosters(req, res, next) {
    
    try {
      var mlbPlayer = await MlbPlayer.findById(req.body.player._id);
      mlbPlayer.ablstatus = {ablTeam : new ObjectId(req.params.id), acqType : req.body.acqType, onRoster: true};
      var savedMlbPlayer = await mlbPlayer.save()
      var popMlbPlayer = MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
      
      var firstDate = req.body.effective_date ? new Date(req.body.effective_date) : new Date()
      
      var mostRecent = await this._getRosterForTeamAndDate(req.params.id, firstDate)  
      var rosterDeadline =  this.getRosterDeadline(firstDate);
      var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
      

      
      if (new Date(mostRecent.effectiveDate) > yesterdayDeadline) {
        // Cool. Move on to update many
        
      } else {
        // Create a new one first. Then, update many
        var newLineup = await Lineup.create({
          ablTeam: mostRecent.ablTeam,
          roster: mostRecent.roster, 
          effectiveDate: rosterDeadline
        })
        
      }
      
      var outputRec;
      var allToUpdate = await Lineup.find({ablTeam: req.params.id, effectiveDate: {$gt: yesterdayDeadline}})
      for (var i = 0; i<allToUpdate.length; i++) {
        allToUpdate[i].roster.push({
          player: mlbPlayer._id, 
          lineupPosition: req.body.player.position, 
          rosterOrder: allToUpdate[i].roster.length + 1
        })
        
        var savedUpdateRec = await allToUpdate[i].save()
        if (allToUpdate[i].effectiveDate <= rosterDeadline) {
          outputRec = allToUpdate[i]
        }
        console.log(`Added ${mlbPlayer.name} to roster for ${savedUpdateRec.effectiveDate}`)
      }
      return res.send({player: savedMlbPlayer, roster: outputRec});

      
    } catch(err) {
      return res.status(500).send({message : err.message})
    }
   
  }
  
  async _dropPlayerFromTeamAllFutureRosters(req, res, next) {
    
    try {
      
      var mlbPlayer = await MlbPlayer.findById(req.params.plyr);
      mlbPlayer.ablstatus = {ablTeam : null, acqType : null, onRoster: false};
      var savedMlbPlayer = await mlbPlayer.save()
      var popMlbPlayer = MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
      
      var mostRecent = await this._getRosterForTeamAndDate(req.params.id, new Date())  
      var rosterDeadline =  this.getRosterDeadline(new Date());
      var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
      
      if (new Date(mostRecent.effectiveDate) > yesterdayDeadline) {
        // Cool. Move on to update many
        
      } else {
        // Create a new one first. Then, update many
        
        console.log("Creating new lineup where player is dropped")
        
        var newLineup = await Lineup.create({
          ablTeam: mostRecent.ablTeam,
          roster: mostRecent.roster, 
          effectiveDate: rosterDeadline
        })
        
      }
      
      
      var remList = await Lineup.updateMany({ablTeam: req.params.id, effectiveDate: {$gt: yesterdayDeadline}}, {$pull : {roster: {player: mlbPlayer._id}}})
      console.log(`Removed ${mlbPlayer.name} from rosters`)
      
      return res.send({success: true});

      
    } catch(err) {
      return res.status(500).send({message : err.message})
    }
   
  }
  
  
  
  
  
  
  async _draftPlayersToTeam(req, res, next) {
    try {
      // expecting an array in req.body...
      
      var roster = []
      
      for (var p=0; p<req.body.length; p++) {
        var mlbPlayer = await MlbPlayer.findById(req.body[p]._id);
        mlbPlayer.ablstatus = {ablTeam : new ObjectId(req.params.id), acqType : 'draft', onRoster: true};
        var savedMlbPlayer = await mlbPlayer.save();
        roster.push({
          player: mlbPlayer._id,
          lineupPosition: req.body[p].position,
          rosterOrder: roster.length + 1
        })

      }
      var existingLineupRec = await Lineup.findOne({ablTeam: req.params.id});
      
      if (existingLineupRec) {
        var priorLineupRec = {
          effectiveDate: existingLineupRec.effectiveDate,
          roster: existingLineupRec.roster
        }
        existingLineupRec.priorRosters.push(priorLineupRec);
        existingLineupRec.roster = roster
        existingLineupRec.effectiveDate = new Date("2021-03-01"); //Should update. But not going to right now. 
        var savedExistingLineupRec = await existingLineupRec.save();
        return res.send(savedExistingLineupRec);
        
      } else {

        const RR = new Lineup({
          ablTeam: new ObjectId(req.params.id),
          roster: roster,
          effectiveDate: new Date("2021-03-01"),
          priorRosters: []
        });
        
        var savedRR = await RR.save();
        return res.send(savedRR);
        
      }
    } catch(err) {
      return res.status(500).send({message : err.message})
    }
   
  }
  
  

   
  reroute() {
    router = this.route();
    router.post('/team/:id/addPlayer', (...args) => this._addPlayerToTeamAllFutureRosters(...args));
    router.post('/team/:id/draftPlayers', (...args) => this._draftPlayersToTeam(...args));
    router.get('/team/:id/lineup' , (...args) => this._getLineup(...args));
    router.put('/lineup_roster/:id', (...args) => this._newUpdateLineup(...args));
    router.get('/team/:id/lineup/:dt', (...args) => this._getLineupForTeamAndDate2(...args));
    router.get('/' + this.routeString +  '/:id/date/:dt', (...args) => this._getLineupForTeamAndDate2(...args));
    router.put('/' + this.routeString + '/:id/date/:dt', (...args) => this._update(...args))
    router.put('/' + this.routeString + '/:id', (...args) => this._update(...args))
    router.get('/' + this.routeString + '/:id/drop/:plyr', (...args) => this._dropPlayerFromTeamAllFutureRosters(...args))
    return router;
  }
}



module.exports = ABLRosterController