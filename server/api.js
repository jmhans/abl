// server/api.js
/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const { expressjwt: jwt} = require('express-jwt');
const jwks = require('jwks-rsa');

const https = require('https');
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

var  league = require('./../data/league.json');

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
    algorithms: ['RS256']
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

  app.get("/api3/league", (req, res)=> {

    res.send(league);
  })
  app.get("/api3/team/:id", AblTeamController._getById);
  app.post('/api3/team/new', jwtCheck, AblTeamController._post );
  app.put('/api3/team/:id', jwtCheck, AblTeamController._put);
  app.delete('/api3/team/:id', jwtCheck, adminCheck, AblTeamController._delete);
  app.get('/api3/teams', AblTeamController._getTeams);
  app.get('/api3/owners', AblTeamController._getOwners);
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
     [
  {
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
  }, {
    '$lookup': {
      'from': 'position_log',
      'let': {
        'plyrId': '$mlbID'
      },
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$and': [
                {
                  '$eq': [
                    '$mlbId', '$$plyrId'
                  ]
                }, {
                  '$eq': [
                    '$season', 2022
                  ]
                }
              ]
            }
          }
        }
      ],
      'as': 'posLog'
    }
  }, {
    '$addFields': {
      'posLog': {
        '$first': '$posLog'
      },
      'priorYearElig': {
        '$first': '$posLog.priorSeasonMaxPos'
      },
      'currentYearElig': {
        '$first': '$posLog.eligiblePositions'
      },
      'eligible': {
        '$first': '$posLog.eligiblePositions'
      }
    }
  }, {
    '$lookup': {
      'from': 'positions',
      'localField': 'player.mlbID',
      'foreignField': 'mlbId',
      'as': 'posRec'
    }
  }, {
    '$addFields': {
      'commishPos': {
        '$ifNull': [
          {
            '$first': '$posRec.position'
          }, '$priorYearElig'
        ]
      }
    }
  }, {
    '$addFields': {
      'allPos': {
        '$concatArrays': [
          [
            '$commishPos'
          ], {
            '$ifNull': [
              '$currentYearElig', []
            ]
          }
        ]
      }
    }
  }, {
    '$addFields': {
      'eligible': {
        '$reduce': {
          'input': '$allPos',
          'initialValue': [],
          'in': {
            '$cond': [
              {
                '$in': [
                  '$$this', '$$value'
                ]
              }, '$$value', {
                '$concatArrays': [
                  '$$value', [
                    '$$this'
                  ]
                ]
              }
            ]
          }
        }
      }
    }
  }, {
    '$project': {
      'commishPos': 0,
      'posRec': 0,
      'allPos': 0,
      'currentYearElig': 0,
      'priorYearElig': 0,
      'position': 0
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
  //app.put('/api3/game/:id/attestations', jwtCheck, AblGameController._removeAttestation);
  app.post('/api3/game/:id/score/:scoreIdx/attestations', jwtCheck, AblGameController._addAttestation);
  app.delete('/api3/game/:id/score/:scoreId/attestations/:attId', jwtCheck, AblGameController._removeAttestation2);
  app.post('/api3/game/:id/results', jwtCheck, AblGameController._postResults);
  app.delete('/api3/game/:id/results/:resultId', jwtCheck, AblGameController._deleteResult);
  app.get('/api3/games/oldResults', jwtCheck, AblGameController._getOldResultGames);
  app.post('/api3/games/oldResults/:gameId', jwtCheck, AblGameController._addIdToResult);

  app.get("/api3/statlines", makeGet(Statline));
  app.get("/api3/statlines/:mlbId", (...args) =>  new StatlineController()._getStatsForPlayer(...args));
  app.get("/api3/positionlogs", (...args) =>  new StatlineController()._generatePositionLog(...args));


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

