/*jshint esversion: 6 */

const request = require('request');
const AblRosterRecord = require('./../models/owner').AblRosterRecord;
const AblTeam = require('./../models/owner').AblTeam;
const MlbPlayer = require('./../models/player').Player;
const Lineup = require('./../models/lineup').Lineup;

const ObjectId = require('mongoose').Types.ObjectId;

var AblRosterController = {

  _post: function(req, res) {
    AblRosterRecord.findOne({
      player: {
        _id: req.body.player._id
      }
    }, (err, existingRosterRec) => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (existingRosterRec) {
        // change existing RosterRecord to inactive. 
      }
      AblTeam.findById(req.body.ablTeamId, (err, ablTeam) => {
        if (err) {
          return res.status(500).send({
            message: err.message
          });
        }
        const RR = new AblRosterRecord({
          player: req.body.player,
          rosterPosition: req.body.player.position, //Use the default position from the player's MLB record.  
          rosterOrder: 100, //Change to find the biggest current number and put this person there. 
          ablTeam: ablTeam._id, // need to find an ablteam model and extract its ID. 
          startDatetime: new Date(),
          active: true
        });
        RR.save((err) => {
          if (err) {
            return res.status(500).send({
              message: err.message
            });
          }
          res.send(RR);
        });
      });



    });
  },
  _getRosters: function(req, res) {
    AblRosterRecord.find({}, (err, rosterRecords) => {
      let rosterRecArr = [];
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (rosterRecords) {
        rosterRecords.forEach(rosterRec => {
          rosterRecArr.push(rosterRec);
        });
      }
      res.send(rosterRecArr);
    })
  },

  _getRosterRecordsForTeam: function(req, res) {
    console.log(req.params.id);
    AblRosterRecord.find({
      ablTeam: new ObjectId(req.params.id)
    }).populate('player').exec(function(err, rosterRecords) {
      let rosterRecsArr = [];
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (rosterRecsArr) {
        rosterRecords.forEach(rosterRecord => {
          rosterRecsArr.push(rosterRecord);
        });
      }
      res.send(rosterRecsArr);
    });
  },

  _getLineupForTeam: function(req, res) {
    
    Lineup.findOne({
      ablTeam: new ObjectId(req.params.id)
    }).populate('roster.player').exec(function(err, lineup){
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      res.send(lineup);
    })
  }, 

  _getLineupForTeamAndDate: function (req, res) {
    
    const gmDt = new Date(req.params.dt)
    
    Lineup.findOne({
      ablTeam: new ObjectId(req.params.id)
    }).populate('roster.player priorRosters.player').exec(function(err, lineup) {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (!lineup) {
        return res.status(400).send({message: 'No lineup found for that date.'});
      }
      console.log(lineup.effectiveDate);
      if (lineup.effectiveDate < gmDt) {
          return res.status(200).send(lineup);
      } else {
        if (lineup.priorRosters.length > 0 ) {
          var sortedPR = lineup.priorRosters.sort(function(a,b) {return (a.effectiveDate - b.effectiveDate);})
          for (s = sortedPR.length - 1; s>=0; s--) {
            if (sortedPR[s].effectiveDate < gmDate) {
              return res.status(200).send(sortedPR[s]);
            }
          }
        } else {
          return res.status(400).send({message: 'No lineup found for that date.'});
        }

        
      }
    })

  }, 
  _getRosterForTeamAndDate: function(teamId, gmDate) {
    return new Promise(function(resolve, reject){
      Lineup.findOne({
        ablTeam: new ObjectId(teamId)
      }).populate('roster.player priorRosters.player').exec(function(err, lineup) {
        console.log(lineup.effectiveDate);
        if (lineup.effectiveDate < gmDate) {
            resolve(lineup.roster);
        } else {
          var sortedPR = lineup.priorRosters.sort(function(a,b) {return (a.effectiveDate - b.effectiveDate);})
          for (s = sortedPR.length - 1; s>=0; s--) {
            if (sortedPR[s].effectiveDate < gmDate) {
              resolve(sortedPR[s]);
            }
          }

        }
      })   
    });


  },
  
  _updateLineup: function(req, res) {
    Lineup.findById(new ObjectId(req.params.id), (err, LineupRec) => {
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      if (LineupRec) {
        var priorLineupRec = {
          effectiveDate: LineupRec.effectiveDate,
          roster: LineupRec.roster
        }
        LineupRec.priorRosters.push(priorLineupRec);
        LineupRec.effectiveDate = new Date();
        LineupRec.roster = req.body.roster;
      } else{
        AblTeam.findById(req.body.ablTeamId, (err, ablTeam) => {
            if (err) {
              return res.status(500).send({
                message: err.message
              });
            }
            const LineupRec = new Lineup({
              ablTeam: ablTeam._id,
              roster: req.body.roster,
              effectiveDate: new Date(),
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
          LineupRec.populate('roster.player', function(err) {
            res.send(LineupRec);
          });
          
          
        });
      });

  },
  _addPlayerToTeam: function(req, res) {
    
    MlbPlayer.findById(req.body._id, (err, mlbPlayer) => {
      
      if (err) {
        return res.status(500).send({
          message: err.message
        });
      }
      mlbPlayer.ablTeam = new ObjectId(req.params.id)
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
            rosterOrder: existingLineupRec.roster.length + 1
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
            roster: [{player: mlbPlayer._id, 
                      lineupPosition: req.body.position, 
                      rosterOrder: 1}], 
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
//   _updatePlayerRecordsFromRosters: function() {
    
//     Lineup.find({}, (err, lineups)=> {
//       if (err) {
//         console.log ("Error finding lineups");
//       }
      
//       lineups.forEach((lineup) => {
//         lineup.roster.forEach((plyr) => {
//           console.log(plyr.player);
//           MlbPlayer.findById(plyr.player, (err, mlbPlayer) => { 
//             if (err) {
//               console.log(plyr);
//               console.log(err);
//             } else {
//               console.log(mlbPlayer);
//               mlbPlayer.ablTeam = new ObjectId(lineup.ablTeam)
//               mlbPlayer.save((err) => {
//                 if (err) {
//                   console.log(mlbPlayer.name + ": ERROR");
//                   console.log(err);
//                 }
//                 else {
//                   console.log(mlbPlayer.name + " updated.")     
//                 }
                
//               }) 
//             }
          
//           })
//         })
//       })
//     })
    
    
//   }
  
  
  
}











module.exports = AblRosterController