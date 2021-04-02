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

var AblRosterController = {

  _getLineupForTeam: function(req, res) {

    Lineup.findOne({
      ablTeam: new ObjectId(req.params.id)
    }).populate('roster.player priorRosters.roster.player').exec(function(err, lineup) {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      console.log(lineup.priorRosters.map((pr)=> {return pr.effectiveDate}));
      if(lineup.priorRosters) {
        lineup.priorRosters.sort((a,b)=> {
          var aDt = new Date(a.effectiveDate);
          var bDt = new Date(b.effectiveDate);
          return bDt - aDt;
        })
      }
      console.log(lineup.priorRosters.map((pr)=> {return pr.effectiveDate}));
      res.send(lineup);
    })
  },

  _getLineupForTeamAndDate: function(req, res) {

    const gmDt = new Date(req.params.dt)

    Lineup.findOne({
      ablTeam: new ObjectId(req.params.id)
    }).populate('roster.player priorRosters.roster.player').exec(function(err, lineup) {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (!lineup) {
        return res.status(400).send({
          message: 'No lineup found for that date.'
        });
      }
      console.log("Effective date of lineup:" + lineup.effectiveDate);
      if (lineup.effectiveDate < gmDt) {
        return res.status(200).send(lineup);
      } else {
        if (lineup.priorRosters.length > 0) {
          var sortedPR = lineup.priorRosters.sort(function(a, b) {
            return (new Date(b.effectiveDate) - new Date(a.effectiveDate));
          })
          for (s = sortedPR.length - 1; s >= 0; s--) {
            if (sortedPR[s].effectiveDate < gmDate) {
              return res.status(200).send(sortedPR[s]);
            }
          }
        } else {
          return res.status(400).send({
            message: 'No lineup found for that date.'
          });
        }


      }
    })

  },
  _getRosterForTeamAndDate: async function(teamId, gmDate) {
    try {
      var lineup = await Lineup.findOne({
        ablTeam: new ObjectId(teamId)
      }).populate('roster.player priorRosters.roster.player').exec();
      if (lineup) {

        if (new Date(lineup.effectiveDate) < gmDate) {
          return lineup.roster;

        } else {
          var sortedPR = lineup.priorRosters.sort(function(a, b) {
            return (new Date(b.effectiveDate) - new Date(a.effectiveDate));
          })
          for (s = sortedPR.length - 1; s >= 0; s--) {
            if (sortedPR[s].effectiveDate < gmDate) {
              return (sortedPR[s].roster);
            }
          }
        }
      } else {
        console.log("didn't find a lineup");
      }
    } catch (err) {
      console.error(`Error in _getRosterForTeamAndDate2:${err}`);
    }

  },

  _newUpdateLineup: function(req, res) {
    Lineup.findById(new ObjectId(req.params.id), (err, LineupRec) => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (LineupRec) {
        var updateRecord;
        if (req.body._id == LineupRec._id) {
          // Updating the active roster record. 
          LineupRec.effective_date = req.body.effective_date;
          LineupRec.roster = req.body.roster;

        } else {
          // Updating a prior roster record.
          updateRecord = LineupRec.priorRosters.find((pr) => {
            return pr._id == req.body._id
          });
          updateRecord.effective_date = req.body.effective_date;
          updateRecord.roster = req.body.roster;
        }

      } else {
        AblTeam.findById(req.body.ablTeamId, (err, ablTeam) => {
          if (err) {
            return res.status(500).send({
              message: err.message
            });
          }
          const LineupRec = new Lineup({
            ablTeam: ablTeam._id,
            roster: req.body.roster,
            effective_date: new Date(),
            priorRosters: []
          });
        })
      }

      LineupRec.save((err) => {
        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        LineupRec.populate('roster.player priorRosters.roster.player', function(err) {
          res.send(LineupRec);
        });


      });
    });
  },
  
  _addPlayerToTeam: function(req, res) {

    console.log("Running this function...")
    
    MlbPlayer.findById(req.body._id, (err, mlbPlayer) => {

      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      mlbPlayer.ablTeam = new ObjectId(req.params.id)
      console.log(mlbPlayer);
      mlbPlayer.save((err) => {
        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }

        Lineup.findOne({
          ablTeam: new ObjectId(req.params.id)
        }).exec((err, existingLineupRec) => {
          if (err) {
            return res.status(500).send({
              message: err.message
            });
          }
          if (existingLineupRec) {
            var priorLineupRec = {
              effectiveDate: existingLineupRec.effectiveDate,
              roster: existingLineupRec.roster
            }
            existingLineupRec.priorRosters.push(priorLineupRec);
            existingLineupRec.effectiveDate = new Date();

            existingLineupRec.roster.push({
              player: mlbPlayer._id,
              lineupPosition: req.body.position,
              rosterOrder: existingLineupRec.roster.length + 1,
              rosterAddType: 'pickup'
            });

            existingLineupRec.save((err) => {
              if (err) {
                return res.status(500).send({
                  message: err.message
                });
              }
              res.send(existingLineupRec);
            });

          } else {

            const RR = new Lineup({
              ablTeam: new ObjectId(req.params.id),
              roster: [{
                player: mlbPlayer._id,
                lineupPosition: req.body.position,
                rosterOrder: 1, 
                rosterAddType: 'pickup'
              }],
              effectiveDate: new Date(),
              priorRosters: []
            });
            RR.save((err) => {
              if (err) {
                return res.status(500).send({
                  message: err.message
                });
              }
              res.send(RR);
            });

          }




        });
      })

    })


  }


}

class altABLRosterController extends BaseController{

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
  
  async _newUpdateLineup(req, res, next) {
    try {
      var LineupRec = await this._getLineupById(req.params.id);
      if (LineupRec) {
        var updateRecord;
        console.log(req.body._id);
        if (!req.body._id) {
          // Create a new lineup rec within the existing one & shift the current to the prior list
          console.log(req.body.effectiveDate);
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
  
  async _addPlayerToTeam(req, res, next) {
    try {
      var mlbPlayer = await MlbPlayer.findById(req.body._id);
      mlbPlayer.ablstatus = {ablTeam : new ObjectId(req.params.id), acqType : 'pickup'};
      var savedMlbPlayer = await mlbPlayer.save();
      var existingLineupRec = await Lineup.findOne({ablTeam: mlbPlayer.ablTeam});
      if (existingLineupRec) {
        var priorLineupRec = {
          effectiveDate: existingLineupRec.effectiveDate,
          roster: existingLineupRec.roster
        }
        existingLineupRec.priorRosters.push(priorLineupRec);
        existingLineupRec.effectiveDate = new Date();

        existingLineupRec.roster.push({
          player: mlbPlayer._id,
          lineupPosition: req.body.position,
          rosterOrder: existingLineupRec.roster.length + 1
        });

        var savedExistingLineupRec = await existingLineupRec.save();
        return res.send(savedExistingLineupRec);
        
      } else {

        const RR = new Lineup({
          ablTeam: new ObjectId(req.params.id),
          roster: [{
            player: mlbPlayer._id,
            lineupPosition: req.body.position,
            rosterOrder: 1
          }],
          effectiveDate: new Date(),
          priorRosters: []
        });
        
        var savedRR = await RR.save();
        return res.send(savedRR);
        
      }
    } catch(err) {
      return res.status(500).send({message : err.message})
    }
   
  }
  
  

   
  route() {
    router.post('/team/:id/addPlayer', (...args) => this._addPlayerToTeam(...args));
    router.get('/team/:id/lineup' , (...args) => this._getLineup(...args));
    router.put('/lineup_roster/:id', (...args) => this._newUpdateLineup(...args));
    router.get('/team/:id/lineup/:dt', (...args) => this._getLineupForTeamAndDate(...args));
    return router;
  }
}

//  app.post('/api3/team/:id/addPlayer', jwtCheck, AblRosterController._addPlayerToTeam);
//  app.get('/api3/team/:id/lineup', jwtCheck, AblRosterController._getLineupForTeam);
//  app.put('/api3/lineup_roster/:id', jwtCheck, AblRosterController._newUpdateLineup);
//  app.get('/api3/team/:id/lineup/:dt', jwtCheck, AblRosterController._getLineupForTeamAndDate);
  



module.exports = {AblRosterController: AblRosterController, altABLRosterController: altABLRosterController}