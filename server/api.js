// server/api.js
/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const Event2 = require('./../models/Event');
const Rsvp = require('./../models/Rsvp');
const https = require('https');
const request = require('request');
const mlbGame = require('./../models/mlbGame');
const Player = require('./../models/player').Player;
const Statline = require('./../models/statline');

const Game = require('./../models/Game');
const MlbApiController = require('./../controllers/mlbapi.controller');
const AblTeamController = require('./../controllers/ablteam.controller');
const AblGameController = require('./../controllers/abl.game.controller');
const AblRosterController = require('./../controllers/abl.roster.controller');
const StatlineController = require('./../controllers/statline.controller');
const BulkAddController = require('./../controllers/bulkadd.controller');
const BulkAdd = BulkAddController.BulkAdd;
const BulkLoad = BulkAddController.BulkLoad;



/*
 |--------------------------------------
 | Authentication Middleware
 |--------------------------------------
 */

module.exports = function(app, config) {
  // Authentication middleware
  const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${config.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: config.AUTH0_API_AUDIENCE,
    issuer: `https://${config.AUTH0_DOMAIN}/`,
    algorithm: 'RS256'
  });

  const adminCheck = (req, res, next) => {
    const roles = req.user[config.NAMESPACE] || [];
    
    if (roles.indexOf('admin') > -1) {
      next();
    } else {
      res.status(401).send({message: 'Not authorized for admin access'});
    }
  }
  
  
/*
 |--------------------------------------
 | API Routes
 |--------------------------------------
 */

  // GET API root
  
  app.get('/api2/', (req, res) => {
    res.send('API works');
  });
  
  const _eventListProjection = 'title startDatetime endDatetime viewPublic';
  
  app.get('/api3/events', (req, res) => {
    Event2.find({viewPublic: true, startDatetime: { $gte: new Date() }}, _eventListProjection, (err, events) => {
      let eventsArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (events) {
        events.forEach(event => {
          eventsArr.push(event);
        });
      }
      res.send(eventsArr);
    });
  });
  

  
  
  app.get('/api3/events/admin', jwtCheck, adminCheck, (req, res) => {
    Event2.find({}, _eventListProjection, (err, events) => {
      let eventsArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (events) {
        events.forEach(event => {
          eventsArr.push(event);
        });
      }
      res.send(eventsArr);
    });
  });
  app.get('/api3/event/:id', jwtCheck, (req, res) => {
    Event2.findById(req.params.id, (err, event) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!event) {
        return res.status(400).send({message: 'Event not found.'});
      }
      res.send(event);
    });
  });
  app.get('/api3/event/:eventId/rsvps', jwtCheck, (req, res) => {
    Rsvp.find({eventId: req.params.eventId}, (err, rsvps) => {
      let rsvpsArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (rsvps) {
        rsvps.forEach(rsvp => {
          rsvpsArr.push(rsvp);
        });
      }
      res.send(rsvpsArr);
    });
  });
  app.post('/api3/rsvp/new', jwtCheck, (req, res) => {
    Rsvp.findOne({eventId: req.body.eventId, userId: req.body.userId}, (err, existingRsvp) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (existingRsvp) {
        return res.status(409).send({message: 'You have already RSVPed to this event.'});
      }
      const rsvp = new Rsvp({
        userId: req.body.userId,
        name: req.body.name,
        eventId: req.body.eventId,
        attending: req.body.attending,
        guests: req.body.guests,
        comments: req.body.comments
      });
      rsvp.save((err) => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.send(rsvp);
      });
    });
  });
  app.put('/api3/rsvp/:id', jwtCheck, (req, res) => {
    Rsvp.findById(req.params.id, (err, rsvp) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!rsvp) {
        return res.status(400).send({message: 'RSVP not found.'});
      }
      if (rsvp.userId !== req.user.sub) {
        return res.status(401).send({message: 'You cannot edit someone else\'s RSVP.'});
      }
      rsvp.name = req.body.name;
      rsvp.attending = req.body.attending;
      rsvp.guests = req.body.guests;
      rsvp.comments = req.body.comments;

      rsvp.save(err => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.send(rsvp);
      });
    });
  });
  app.post('/api3/event/new', jwtCheck, adminCheck, (req, res) => {
    Event2.findOne({
      title: req.body.title,
      location: req.body.location,
      startDatetime: req.body.startDatetime}, (err, existingEvent) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (existingEvent) {
        return res.status(409).send({message: 'You have already created an event with this title, location, and start date/time.'});
      }
      const event = new Event2({
        title: req.body.title,
        location: req.body.location,
        startDatetime: req.body.startDatetime,
        endDatetime: req.body.endDatetime,
        description: req.body.description,
        viewPublic: req.body.viewPublic
      });
      event.save((err) => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.send(event);
      });
    });
  });
  // PUT (edit) an existing event
  app.put('/api3/event/:id', jwtCheck, adminCheck, (req, res) => {
    Event2.findById(req.params.id, (err, event) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!event) {
        return res.status(400).send({message: 'Event not found.'});
      }
      event.title = req.body.title;
      event.location = req.body.location;
      event.startDatetime = req.body.startDatetime;
      event.endDatetime = req.body.endDatetime;
      event.viewPublic = req.body.viewPublic;
      event.description = req.body.description;

      event.save(err => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.send(event);
      });
    });
  });

  // DELETE an event and all associated RSVPs
  app.delete('/api3/event/:id', jwtCheck, adminCheck, (req, res) => {
    Event2.findById(req.params.id, (err, event) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!event) {
        return res.status(400).send({message: 'Event not found.'});
      }
      Rsvp.find({eventId: req.params.id}, (err, rsvps) => {
        if (rsvps) {
          rsvps.forEach(rsvp => {
            rsvp.remove();
          });
        }
        event.remove(err => {
          if (err) {
            return res.status(500).send({message: err.message});
          }
          res.status(200).send({message: 'Event and RSVPs successfully deleted.'});
        });
      });
    });
  });
  
  
   app.get("/api3/mlbGame/:dt", MlbApiController._get);
  
  app.get("/api3/team/:id", AblTeamController._getById);
  app.post('/api3/team/new', jwtCheck, AblTeamController._post );
  app.put('/api3/team/:id', jwtCheck, AblTeamController._put);
  app.delete('/api3/team/:id', jwtCheck, adminCheck, AblTeamController._delete);
  app.get('/api3/teams', AblTeamController._getTeams);
  app.get('/api3/owners', AblTeamController._getOwners);
  app.post('/api3/roster/new', AblRosterController._post);
  app.get('/api3/rosterRecords', AblRosterController._getRosters);
  app.get('/api3/team/:id/rosterRecords', jwtCheck, AblRosterController._getRosterRecordsForTeam);
  app.post('/api3/team/:id/addPlayer', jwtCheck, AblRosterController._addPlayerToTeam);
  app.get('/api3/team/:id/lineup', jwtCheck, AblRosterController._getLineupForTeam);
  app.put('/api3/lineup/:id', jwtCheck, AblRosterController._updateLineup);
  app.get('/api3/team/:id/lineup/:dt', jwtCheck, AblRosterController._getLineupForTeamAndDate);
  app.get('/api3/games', /*jwtCheck,*/ AblGameController._getAllGames);
  app.delete('/api3/game/:id', jwtCheck, adminCheck, AblGameController._delete);
  
  app.get("/api3/mlbGames", (req, res) => {
    mlbGame.find({}, (err, games) => {
      let gamesArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (games) {
        games.forEach(game => {
          gamesArr.push(game);
        });
      }
      res.send(gamesArr);
    });
  })
//   app.get("/api3/mlbPlayers", (req, res) => {
//     Player.find({ablTeam: null}, (err, players) => {
//       let playersArr = [];
//       if (err) {
//         return res.status(500).send({message: err.message});
//       }
//       if (players) {
//         players.forEach((player) => {
//           playersArr.push(player);
//         });
//       }
//       res.send(playersArr);
//     });
//   })
  
  app.get("/api3/mlbPlayers", (req, res, next) => {
    
    Player.aggregate([
        {$lookup: {from: "activeRosterRecords", localField:"_id", foreignField:"roster.player", as: "ablRoster"}}, 
        {$unwind: {path: "$ablRoster", preserveNullAndEmptyArrays:true}}, 
        {$addFields: {"ablTeam": "$ablRoster.ablTeam"}}, 
        {$project: {"ablRoster":0}},
        {$lookup: {from: "ablteams", localField:"ablTeam", foreignField:"_id", as: "ablTeam"}},
        {$unwind: {path: "$ablTeam", preserveNullAndEmptyArrays:true}}
    ], function(err, players) {
      if (err) return next(err);

      res.send(players);
    });
    
  })
  
  app.get('/api3/player/:id', jwtCheck, (req, res) => {
    Player.findById(req.params.id, (err, player) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!player) {
        return res.status(400).send({message: 'Player not found.'});
      }
      res.send(player);
    });
  });
  
  
  app.get('/api3/game/:id', jwtCheck, AblGameController._getById);
  app.get('/api3/game/:id/rosters', (...args) => AblGameController._getRosters(...args))
  
  app.post('/api3/game/new', jwtCheck, AblGameController._post );
  app.put('/api3/game/:id', jwtCheck, AblGameController._put);
  
  app.get("/api3/statlines", makeGet(Statline));
  app.get("/api3/statlines/:mlbId", (...args) =>  new StatlineController()._getStatsForPlayer(...args));
  app.get("/data/:flname", jwtCheck, BulkAdd._getFile);
  var bl = new BulkLoad();
  app.post("/data/:model", jwtCheck,  (...args) => bl._postData(...args));
  
  function makeGet(model) {
    return function(req, res) {
      model.find({}, (err, results) => {
        let resultsArr = [];
        if (err) {
          return res.status(500).send({message: err.message});
        }
        if (results) {
          results.forEach((result) => {
            resultsArr.push(result);
          });
        }
        res.send(resultsArr);
      });
    } 
  }
  
  
  //One time use: 
//   AblRosterController._updatePlayerRecordsFromRosters();
  // Delete after completing.
  
  
  var api = require('../routes/api.route');
  app.use('/api2', api);

};

