/*jshint esversion: 8 */

const BaseController = require('./base.controller');
var express = require('express');
var router = express.Router();

const EventEmitter = require('events');
const Stream = new EventEmitter();

const SSE =require('./sse.controller');
// Fake Change

const AblRosterRecord = require('./../models/owner').AblRosterRecord;
const AblTeam = require('./../models/owner').AblTeam;
const MlbPlayer = require('./../models/player').Player;
const MlbEnrichedPlayerModel = require('./../models/player').PlayerView;
const PlayerStream =require('./../models/player').PlayerStream;
const Lineup = require('./../models/lineup').Lineup;
const CurrentLineupModel=require('./../models/lineup').CurrentLineups;
const DraftPick = require('./../models/draft').DraftPick;
var some_league_variable = require('./../data/league.json');

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
        [
          {
            $match: {
              ablTeam: new ObjectId(teamId),
              effectiveDate: {
                $lte: new Date(gmDate),
              },
            },
          },
          {
            $sort: {
              effectiveDate: -1
            }
          },
          {
            $limit: 1
          },
          {
            $unwind: {
              path: "$roster",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $lookup:
              {
                from: "players_view",
                let: {
                  plyrId: "$roster.player"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$$plyrId", "$_id"]
                      }
                    }
                  }
                ],
                as: "player"
              }
          },
          {
            $unwind:
              {
                path: "$player",
                preserveNullAndEmptyArrays: true
              }
          },
          {
            $project: {
              allPos: 0,
              tempCommish: 0,
              posLog: 0,
              newPosLog: 0,
              rosterStatus: 0,
              priorRosters: 0
            }
          },
          {
            $group: {
              _id: "$_id",
              roster: {
                $push: {
                  player: "$player",
                  lineupPosition:
                    "$roster.lineupPosition",
                  rosterOrder: "$roster.rosterOrder"
                }
              },
              effectiveDate: {
                $first: "$effectiveDate"
              },
              ablTeam: {
                $first: "$ablTeam"
              }
            }
          }
        ]


)
      if (atomicLineup) {
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

        var noonLocalVal = new Date(dt.toISOString().substr(0, 10)+"T" + some_league_variable.rosterLockTime)

        var deadlineAdjCompare = new Date(noonLocalVal.toLocaleString('en-US', {
          timeZone: some_league_variable.rosterLockTimeZone
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

        var updatedLineup = await this._getRosterForTeamAndDate(req.params.id, rosterDeadline)

        // change to bump code.

        // var populated = await updatedRec.populate('roster.player priorRosters.roster.player').execPopulate()
        res.json(updatedLineup)
      }
      } catch (err) {
            console.log(err);
          }


  }


async _makeDraftPick(plyr, teamId, acqType) {
  try {
    var newPick = {season: "2025", player: new ObjectId(plyr._id), ablTeam: new ObjectId(teamId), pickTime: new Date(), draftType: acqType}
    var draftPick = await DraftPick.create(newPick);
    var popDP = await draftPick.populate('player');
    console.log(`Drafted Player`)
    SSE.emit('push', 'draft', {msg: 'Draft works!', pick: popDP})
    return popDP.player
  } catch (err) {
    console.log(`I have failed to make draft pick. ${err}`)
  }

}


  async _addPlayerToTeamBackend(plyr, teamId, acqType, effDate, forceDraft = false, processingDraft = false ) {
    try {
      if ((acqType == 'draft' || acqType == 'supp_draft') && !processingDraft) {
          console.log(`In draft player logic`)
        let draftedPlyr = await this._makeDraftPick(plyr, teamId, acqType)
        return {player: draftedPlyr, roster: []};

      } else {
          console.log(`Updating Player within add: ${plyr.name}}`)
        var savedMlbPlayer = await this._updatePlayerRecBackend(plyr, teamId, acqType, effDate )
//        var popMlbPlayer = await MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
        var firstDate = effDate ? new Date(effDate) : new Date()
        var rosterDeadline =  this.getRosterDeadline(firstDate);
        var mostRecent = await this._getRosterForTeamAndDate(teamId, rosterDeadline)

        var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
        var newLineup;


        if (mostRecent) {
          if (new Date(mostRecent.effectiveDate) > yesterdayDeadline) {
            // Cool. Move on to update many

          } else {
            // Create a new one first. Then, update many
            if (mostRecent) {

              newLineup = await Lineup.create({
                ablTeam: mostRecent.ablTeam,
                roster: mostRecent.roster,
                effectiveDate: rosterDeadline
              })
            }

          }

        } else {

              newLineup = await Lineup.create({
                ablTeam: new ObjectId(teamId),
                roster: [],
                effectiveDate: rosterDeadline
              })
        }


        var outputRec;
        var allToUpdate = await Lineup.find({ablTeam: teamId, effectiveDate: {$gt: yesterdayDeadline}})
        var plyrPos = null;

        if (plyr.eligible && plyr.eligible.length > 0) {
          plyrPos = plyr.eligible[0]
        }

        for (var i = 0; i<allToUpdate.length; i++) {
          allToUpdate[i].roster.push({
            player: savedMlbPlayer._id,
            lineupPosition: plyrPos,
            rosterOrder: allToUpdate[i].roster.length + 1
          })

          var savedUpdateRec = await allToUpdate[i].save()
          if (allToUpdate[i].effectiveDate <= rosterDeadline) {
            outputRec = allToUpdate[i]
          }
          console.log(`Added ${savedMlbPlayer.name} to roster for ${savedUpdateRec.effectiveDate}`)
        }

        SSE.emit('push', 'rosters', {msg: 'rosters sse works!'})

        return {player: savedMlbPlayer, roster: outputRec};

      }



    } catch(err) {
      throw {message: err.message}
    }
  }


  async _updatePlayerRecBackend(plyr, teamId, acqType, effDate ) {
    // Just updates the player record to be on a roster. A separate function handles the roster updating.
    try {

      var mlbPlayer = await MlbPlayer.findById(plyr._id);
      if (mlbPlayer) {
        mlbPlayer.ablstatus = {ablTeam : new ObjectId(teamId), acqType : acqType, onRoster: true};
        var savedMlbPlayer = await mlbPlayer.save()
        return savedMlbPlayer;
      } else {
        console.log(`Could not find player with _id=${plyr._id}`)
      }

    } catch(err) {
      throw {message: err.message}
    }
  }





  async _addPlayerToTeamAllFutureRosters(req, res, next) {

    try {
      var result = await this._addPlayerToTeamBackend(req.body.player, req.params.id, req.body.acqType, req.body.effectiveDate)

      return res.send(result);


    } catch(err) {
      return res.status(500).send({message : err.message})
    }

  }

  async _dropAllPickups(req, res, next) {
   try {
     let allPickups = await MlbPlayer.find({"ablstatus.acqType": {$ne: "draft"}, "ablstatus.onRoster": true}).exec()
     console.log(allPickups)
     for (let p=0; p<allPickups.length; p++) {
      let dropDude = this._dropPlayerBackend(allPickups[p]._id, allPickups[p].ablstatus.ablTeam)
      console.log(dropDude.name)
     }
     return res.send({success: true, dropCount: allPickups.length});


   } catch(err) {
     return res.status(500).send({message: err.message})
   }
  }



  async _dropPlayerBackend(plyr, tmId) {
    try {
      var mlbPlayer = await MlbPlayer.findById(plyr);
      mlbPlayer.ablstatus = {ablTeam : null, acqType : null, onRoster: false};
      var savedMlbPlayer = await mlbPlayer.save()
      var popMlbPlayer = await MlbPlayer.populate(savedMlbPlayer, {path: 'ablstatus.ablTeam'});
      var rosterDeadline =  this.getRosterDeadline(new Date());
      console.log(`${tmId}`)
      var mostRecent = await this._getRosterForTeamAndDate(tmId, rosterDeadline)
      console.log(`Found Most Recent ${mostRecent._id}`)

      var yesterdayDeadline = new Date((new Date(rosterDeadline.toISOString())).setDate(rosterDeadline.getDate()-1))
      if (new Date(mostRecent.effectiveDate) > yesterdayDeadline) {
        // Cool. Move on to update many
        console.log(`I'm in the true condition: ${mostRecent.effectiveDate}`)

      } else {
        // Create a new one first. Then, update many

        var newLineup = await Lineup.create({
          ablTeam: mostRecent.ablTeam,
          roster: mostRecent.roster,
          effectiveDate: rosterDeadline
        })
      }

      var remList = await Lineup.updateMany({ablTeam: tmId, effectiveDate: {$gt: yesterdayDeadline}}, {$pull : {roster: {player: mlbPlayer._id}}})
      console.log(`Removed ${mlbPlayer.name} from rosters`)
      return popMlbPlayer

    } catch (err) {
      console.log(err)
    }
  }

  async _dropPlayerFromTeamAllFutureRosters(req, res, next) {

    try {
      let popMlbPlayer = await this._dropPlayerBackend(req.params.plyr, req.params.id)
      return res.send({success: true, player: popMlbPlayer});

    } catch(err) {
      return res.status(500).send({message : err.message})
    }

  }

  async _updateDraft(req, res) {
    req.setTimeout(600000);
    res.writeHead(200, {
      'Content-Type' : 'text/event-stream',
      'Cache-Control':'no-cache',
      Connection: 'keep-alive',
        })
      Stream.on('push', function(event, data) {
        res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
      })
      this.establishHeartbeat(Stream);

  }


  async _updatePlayers(req, res) {
    req.setTimeout(600000);
    res.writeHead(200, {
      'Content-Type' : 'text/event-stream',
      'Cache-Control':'no-cache',
      Connection: 'keep-alive',
        })
      PlayerStream.on('push', function(event, data) {
        res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
      })
      this.establishHeartbeat(PlayerStream);

  }

  _get(req, res, next) {
      console.log(`Call made to ${this.routeString}`)
    CurrentLineupModel.find(function(err, results) {
        console.log('I am doing the lineup thing now.')
      if (err) {
          console.log(err);
          return next(err)
      };
      console.log("I am sending back the results");
      res.json(results);
    });
    }


 establishHeartbeat(strm){
     console.log('Heartbeat establishing.')
   setInterval(function() {
    strm.emit('push', 'ping', {msg: "testing server ping from ABL Roster controller"})
   }, 30000)
 }

 async _getUsers(req, res, next) {
  try {
    let userData = await AblTeam.aggregate([
    {
      $unwind:
        {
          path: "$owners",
          preserveNullAndEmptyArrays: false,
        },
    },
    {
      $project:

        {
          name: "$owners.name",
          userId: "$owners.userId",
          email: "$owners.email",
          _id: "$owners._id",
          team: {
            location: "$location",
            nickname: "$nickname",
            _id: "$_id",
          },
        },
    },
  ])
  return res.send(userData);
} catch (err) {
  return res.status(500).send({message: err.message});
}
 }

  reroute() {
    router = this.route();
    router.post('/team/:id/addPlayer', (...args) => this._addPlayerToTeamAllFutureRosters(...args));
    router.get('/team/:id/lineup' , (...args) => this._getLineup(...args));
    router.put('/lineup_roster/:id', (...args) => this._newUpdateLineup(...args));
    router.get('/team/:id/lineup/:dt', (...args) => this._getLineupForTeamAndDate2(...args));
    router.get('/' + this.routeString +  '/:id/date/:dt', (...args) => this._getLineupForTeamAndDate2(...args));
    router.put('/' + this.routeString + '/:id/date/:dt', (...args) => this._update(...args))
    router.put('/' + this.routeString + '/:id', (...args) => this._update(...args))
    router.get('/' + this.routeString + '/:id/drop/:plyr', (...args) => this._dropPlayerFromTeamAllFutureRosters(...args))
    router.get('/refreshDraft', (...args)=>this._updateDraft(...args));
    router.get('/playerUpdates', (...args)=>this._updatePlayers(...args));
    router.get('/users' , (...args) => this._getUsers(...args));
    router.get('/dropallPickups', (...args)=> this._dropAllPickups(...args));

    return router;
  }
}

module.exports = ABLRosterController
