// server/api.js
/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const jwt = require('express-jwt');
const jwks = require('jwks-rsa');

const https = require('https');
const request = require('request');
const mlbGame = require('./../models/mlbGame');
const Player = require('./../models/player').Player;
const Statline = require('./../models/statline');

const Game = require('./../models/Game');
const AblTeamController = require('./../controllers/ablteam.controller');
const AblGameController = require('./../controllers/abl.game.controller');
const AblRosterController = require('./../controllers/abl.roster.controller').AblRosterController;
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
  
  
  app.get("/api3/team/:id", AblTeamController._getById);
  app.post('/api3/team/new', jwtCheck, AblTeamController._post );
  app.put('/api3/team/:id', jwtCheck, AblTeamController._put);
  app.delete('/api3/team/:id', jwtCheck, adminCheck, AblTeamController._delete);
  app.get('/api3/teams', AblTeamController._getTeams);
  app.get('/api3/owners', AblTeamController._getOwners);
 //app.post('/api3/team/:id/addPlayer', jwtCheck, AblRosterController._addPlayerToTeam);
  //app.get('/api3/team/:id/lineup', jwtCheck, AblRosterController._getLineupForTeam);
  //app.put('/api3/lineup_roster/:id', jwtCheck, AblRosterController._newUpdateLineup);
  //app.get('/api3/team/:id/lineup/:dt', jwtCheck, AblRosterController._getLineupForTeamAndDate);
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

  
  app.get("/api3/mlbPlayers", (req, res, next) => {
    
    Player.aggregate(
      [{
          '$lookup': {
            'from': 'ablteams', 
            'localField': 'ablstatus.ablTeam', 
            'foreignField': '_id', 
            'as': 'ablstatus.ablTeam'
          }
        }, {
          '$unwind': {
            'path': '$ablstatus.ablTeam', 
            'preserveNullAndEmptyArrays': true
          }
        }
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
  app.put('/api3/game/:id/results', jwtCheck, AblGameController._updateResults);
  
  app.get("/api3/statlines", makeGet(Statline));
  app.get("/api3/statlines/:mlbId", (...args) =>  new StatlineController()._getStatsForPlayer(...args));
  app.get("/api3/statlines/date/:dt", (...args) =>  new StatlineController()._getStatsForDate(...args));
  
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

