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

// var AblRosterController = {

//   _getLineupForTeam: function(req, res) {

//     Lineup.findOne({
//       ablTeam: new ObjectId(req.params.id)
//     }).populate('roster.player priorRosters.roster.player').exec(function(err, lineup) {
//       if (err) {
//         return res.status(500).send({
//           message: err.message
//         });
//       }
//       console.log(lineup.priorRosters.map((pr)=> {return pr.effectiveDate}));
//       if(lineup.priorRosters) {
//         lineup.priorRosters.sort((a,b)=> {
//           var aDt = new Date(a.effectiveDate);
//           var bDt = new Date(b.effectiveDate);
//           return bDt - aDt;
//         })
//       }
//       console.log(lineup.priorRosters.map((pr)=> {return pr.effectiveDate}));
//       res.send(lineup);
//     })
//   },

//   _getLineupForTeamAndDate: function(req, res) {

//     const gmDt = new Date(req.params.dt)

//     Lineup.findOne({
//       ablTeam: new ObjectId(req.params.id)
//     }).populate('roster.player priorRosters.roster.player').exec(function(err, lineup) {
//       if (err) {
//         return res.status(500).send({
//           message: err.message
//         });
//       }
//       if (!lineup) {
//         return res.status(400).send({
//           message: 'No lineup found for that date.'
//         });
//       }
//       console.log("Effective date of lineup:" + lineup.effectiveDate);
//       if (lineup.effectiveDate < gmDt) {
//         return res.status(200).send(lineup);
//       } else {
//         if (lineup.priorRosters.length > 0) {
//           var sortedPR = lineup.priorRosters.sort(function(a, b) {
//             return (new Date(b.effectiveDate) - new Date(a.effectiveDate));
//           })
//           for (s = sortedPR.length - 1; s >= 0; s--) {
//             if (sortedPR[s].effectiveDate < gmDate) {
//               return res.status(200).send(sortedPR[s]);
//             }
//           }
//         } else {
//           return res.status(400).send({
//             message: 'No lineup found for that date.'
//           });
//         }


//       }
//     })

//   },
//   _getRosterForTeamAndDate: async function(teamId, gmDate) {
//     try {
//       var lineup = await Lineup.findOne({
//         ablTeam: new ObjectId(teamId)
//       }).populate('roster.player priorRosters.roster.player').exec();
//       if (lineup) {

//         if (new Date(lineup.effectiveDate) < gmDate) {
//           return lineup.roster;

//         } else {
//           var sortedPR = lineup.priorRosters.sort(function(a, b) {
//             return (new Date(b.effectiveDate) - new Date(a.effectiveDate));
//           })
//           for (s = sortedPR.length - 1; s >= 0; s--) {
//             if (sortedPR[s].effectiveDate < gmDate) {
//               return (sortedPR[s].roster);
//             }
//           }
//         }
//       } else {
//         console.log("didn't find a lineup");
//       }
//     } catch (err) {
//       console.error(`Error in _getRosterForTeamAndDate2:${err}`);
//     }

//   },

//   _newUpdateLineup: function(req, res) {
//     Lineup.findById(new ObjectId(req.params.id), (err, LineupRec) => {
//       if (err) {
//         return res.status(500).send({
//           message: err.message
//         });
//       }
//       if (LineupRec) {
//         var updateRecord;
//         if (req.body._id == LineupRec._id) {
//           // Updating the active roster record. 
//           LineupRec.effective_date = req.body.effective_date;
//           LineupRec.roster = req.body.roster;

//         } else {
//           // Updating a prior roster record.
//           updateRecord = LineupRec.priorRosters.find((pr) => {
//             return pr._id == req.body._id
//           });
//           updateRecord.effective_date = req.body.effective_date;
//           updateRecord.roster = req.body.roster;
//         }

//       } else {
//         AblTeam.findById(req.body.ablTeamId, (err, ablTeam) => {
//           if (err) {
//             return res.status(500).send({
//               message: err.message
//             });
//           }
//           const LineupRec = new Lineup({
//             ablTeam: ablTeam._id,
//             roster: req.body.roster,
//             effective_date: new Date(),
//             priorRosters: []
//           });
//         })
//       }

//       LineupRec.save((err) => {
//         if (err) {
//           return res.status(500).send({
//             message: err.message
//           });
//         }
//         LineupRec.populate('roster.player priorRosters.roster.player', function(err) {
//           res.send(LineupRec);
//         });


//       });
//     });
//   },
  
//   _addPlayerToTeam: function(req, res) {

//     console.log("Running this function...")
    
//     MlbPlayer.findById(req.body._id, (err, mlbPlayer) => {

//       if (err) {
//         return res.status(500).send({
//           message: err.message
//         });
//       }
//       mlbPlayer.ablTeam = new ObjectId(req.params.id)
//       console.log(mlbPlayer);
//       mlbPlayer.save((err) => {
//         if (err) {
//           return res.status(500).send({
//             message: err.message
//           });
//         }

//         Lineup.findOne({
//           ablTeam: new ObjectId(req.params.id)
//         }).exec((err, existingLineupRec) => {
//           if (err) {
//             return res.status(500).send({
//               message: err.message
//             });
//           }
//           if (existingLineupRec) {
//             var priorLineupRec = {
//               effectiveDate: existingLineupRec.effectiveDate,
//               roster: existingLineupRec.roster
//             }
//             existingLineupRec.priorRosters.push(priorLineupRec);
//             existingLineupRec.effectiveDate = new Date();

//             existingLineupRec.roster.push({
//               player: mlbPlayer._id,
//               lineupPosition: req.body.position,
//               rosterOrder: existingLineupRec.roster.length + 1,
//               rosterAddType: 'pickup'
//             });

//             existingLineupRec.save((err) => {
//               if (err) {
//                 return res.status(500).send({
//                   message: err.message
//                 });
//               }
//               res.send(existingLineupRec);
//             });

//           } else {

//             const RR = new Lineup({
//               ablTeam: new ObjectId(req.params.id),
//               roster: [{
//                 player: mlbPlayer._id,
//                 lineupPosition: req.body.position,
//                 rosterOrder: 1, 
//                 rosterAddType: 'pickup'
//               }],
//               effectiveDate: new Date(),
//               priorRosters: []
//             });
//             RR.save((err) => {
//               if (err) {
//                 return res.status(500).send({
//                   message: err.message
//                 });
//               }
//               res.send(RR);
//             });

//           }




//         });
//       })

//     })


//   }
  
  
  


// }

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
      //var populated = await MlbPlayer.populate(atomicLineup[0], {path: 'roster.player'}).exec();
      
      if (atomicLineup) {
//        var populated = Lineup.populate(atomicLineup, {path: 'roster.player'}).exec()
        
        console.log(atomicLineup)
       
        return atomicLineup[0]
      } else {
        console.log("didn't find a lineup");
      }
      
      
      
//       var lineup = await Lineup.findOne({ablTeam: new ObjectId(teamId)}).populate('roster.player priorRosters.roster.player').exec();
//       if (lineup) {
//         if (new Date(lineup.effectiveDate) <= gmDate) {
//           console.log("Found current roster")
//           return lineup.roster;

//         } else {
//           var sortedPR = lineup.priorRosters.sort(function(a, b) {
//             return (new Date(b.effectiveDate) - new Date(a.effectiveDate));
//           })
//           for (var s = sortedPR.length - 1; s >= 0; s--) {
//             if (sortedPR[s].effectiveDate < gmDate) {
//               console.log("Found old roster")
//               return (sortedPR[s].roster);
//             }
//           }
//         }
//       } else {
//         console.log("didn't find a lineup");
//       }
    } catch (err) {
      console.error(`Error in _getRosterForTeamAndDate2:${err}`);
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
      var mlbPlayer = await MlbPlayer.findById(req.body._id);
      mlbPlayer.ablstatus = {ablTeam : new ObjectId(req.params.id), acqType : 'pickup', onRoster: true};
      var savedMlbPlayer = await mlbPlayer.save()
      var popMlbPlayer = MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
      
      // If I explicitly have a lineup for today, update it and all futures...updateMany() with upsert = true will accommodate that. 
      // If I do not have a lineup record for today, but do for future, I need to create one for today, and also update all future. updateMany() will work for all future, but won't create new for today. 
      // If I do not have a lineup record for today or any future, I need to create one for today. updateMany() with upsert = true, as long as setOnInsert sets effDate correctly, but also need to set with most recent lineup, which is more difficult... 

      
      // First, create one for today (without the new dude)
      // Then, updateMany(). That will update all future, and also today. Upsert should not matter. 
      
      var mostRecent = await this._getRosterForTeamAndDate(req.params.id, new Date()) // need to modify to look for upcoming game date deadline.  
      var rosterDeadline =  this.getRosterDeadline(new Date());
      var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
      
      console.log(mostRecent.effectiveDate);
      
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
          lineupPosition: req.body.position, 
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
  
  async _addPlayerToTeam(req, res, next) {
    try {
      var mlbPlayer = await MlbPlayer.findById(req.body._id);
      mlbPlayer.ablstatus = {ablTeam : new ObjectId(req.params.id), acqType : 'pickup', onRoster: true};
      var savedMlbPlayer = await mlbPlayer.save()
      var popMlbPlayer = MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
      var existingLineupRec = await Lineup.findOne({ablTeam: req.params.id});
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
        console.log(savedExistingLineupRec);
        console.log(savedMlbPlayer);
        return res.send({player: savedMlbPlayer, roster: savedExistingLineupRec});
        
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
        console.log(savedRR);
        return res.send({player: savedMlbPlayer, roster: savedRR});
        
      }
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
    return router;
  }
}

//  app.post('/api3/team/:id/addPlayer', jwtCheck, AblRosterController._addPlayerToTeam);
//  app.get('/api3/team/:id/lineup', jwtCheck, AblRosterController._getLineupForTeam);
//  app.put('/api3/lineup_roster/:id', jwtCheck, AblRosterController._newUpdateLineup);
//  app.get('/api3/team/:id/lineup/:dt', jwtCheck, AblRosterController._getLineupForTeamAndDate);
  



module.exports = {/*AblRosterController: AblRosterController,*/ altABLRosterController: altABLRosterController}