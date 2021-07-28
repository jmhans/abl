/*jshint esversion: 8 */

const request = require('request');
const axios = require('axios');
var   express = require('express');
var   router = express.Router();
const BASE_URL = "https://statsapi.mlb.com/api/v1";//"http://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
const mlbGame = require('./../models/mlbGame');

const BaseController = require('./base.controller');

const ablConfig = require('./../server/ablConfig');

var   StatlineController = require('../controllers/statline.controller');
var   PlayersController = require('../controllers/players.controller');


    var pad = function(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }


class altMlbApiController extends BaseController{

  constructor() {
    super(mlbGame, 'mlbgame');
  }
  
  async _getGames(req, res, next) {
    try {
      const games = await this._getGamesForDate(req.params.gm_dt);
      return res.send(games);
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }
  
  
  async _getGamesForDate(gm_date) {
    try {
      var inputDate = new Date(gm_date)
      var day = pad(inputDate.getUTCDate(), 2); //getDate returns the date for the local timezone.  
      var month = pad(inputDate.getUTCMonth() + 1, 2);
      var year = inputDate.getUTCFullYear();
      const APIUrl = BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day + "%2F" + year
      var retBody = await axios.get(APIUrl);      
      var gamesList = [];
      
      var dateItem = retBody.data.dates.find(x=>x.date == (year + "-" + month + "-" + day));
      
      if (dateItem) {
        gamesList = dateItem.games
        this._loadGamesToDB(gamesList);
      }
      return gamesList
      
    } catch(err) {
      console.error(`Error in _getGames: ${err}`)
    }
  }
  
  async _loadGamesToDB(gamesList) {
    try {
      gamesList.forEach((gm) => {
        
          var query = {
            'gamePk': gm.gamePk
          };
          mlbGame.findOneAndUpdate(query, gm, {
            upsert: true
          }, function(err, doc) {
            if (err) return res.send(500, {
              error: err
            });

            //return res.send("succesfully saved");
          });
        
          if (gm.status.codedGameState != 'D') {
            this.loadPlayersInGame(gm);    
          }
        
        
        
      });
    } catch(err) {
      console.error(`Error in _loadGamesToDB: ${err}`)
    }
  }
  
  
  
 async loadPlayersInGame(gm) {
    const APIUrl = BASE_URL + "/game/" + gm.gamePk + "/boxscore";
    request(APIUrl, {
      json: true
    }, async (err, resp, body) => {
      if (err) {
        return console.log(err);
      }    
      
      try {
        const awayPlayers = await this.loadTeamPlayers(body.teams, "away", gm);
        const homePlayers = await this.loadTeamPlayers(body.teams, "home", gm);
        console.log(awayPlayers.length + " away team players and " + homePlayers.length + " home team players logged.")
        return {away: awayPlayers, home: homePlayers};

      } catch (err) {
        
      }
    })
 }
  
 async loadTeamPlayers(teams, teamType, gm) {
  var PositionPlayers = []
  var players = teams[teamType].players

  var team = teams[teamType].team
  var playerKeys = [];
  for (var playerKey in players) {
    if (players.hasOwnProperty(playerKey)) {
      playerKeys.push(playerKey)  
    }

  }


  try {
    var plyrs = [];
    for (var pk = 0; pk<playerKeys.length; pk++) { 
      let player = players[playerKeys[pk]]
      const plyr = await new PlayersController()._updatePlayer(player, team , gm); // appendPlayerRecord(player, team, gm);
      const sl = await new StatlineController()._updateStatline(player, gm);  //updateStatlineRecord(player, team, gamePk, gameDt);
      plyrs.push(player.person.id)

    }
    return plyrs;
  } catch (err) {
    console.error(`Error in getTeamPlayers:${err}`)
  }
}
  
    

   
  route() {
    router.get('/' + this.routeString + '/:gm_dt' , (...args) => this._getGames(...args));
    return router;
  }
 
}





const MLBStatsAPI = require('mlb-stats-api');


class mlbAPI {
  
  constructor() {
    this.mlbStats = new MLBStatsAPI();
  }
  


  async _getGame(gmPk) {
    
    try {
      const response = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: gmPk }});
      return response.data;
      } catch (err) {
        console.error(`Error in _getGame: ${err}`);
      }
    }

  async _getBoxHttp(req, res, next) {
    
      try {
          const gm = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: req.params.id }}); //await this._getGame(529572);
          return res.send(gm);
       } catch (err) {
        console.error(`Error in getGameHttp(): ${err}`);
        return res.status(500).send({message: err.message});

      }

  }
  async _getSchedule(dt) {
    try {
          const sched = await this.mlbStats.getSchedule({ params: { date: dt, sportId: 1 }}); //await this._getGame(529572);
          return sched.data;
       } catch (err) {
        console.error(`Error in getSchedule(): ${err}`);
      }
  }
  
  async _getResourceHttp(req, res, next) {
    try {
      var fn;
      switch (req.params.resource) {
        case "game": 
          fn = this.mlbStats.getGameBoxscore
          break;
        case "schedule": 
          fn = this.mlbStats.getSchedule
          break;
        default: 

      }


      const results = await fn({params: req.query});
      return res.send(results.data)  
    } catch (err) {
      console.error(`Error in getResourceHttp(): ${err}`);
      return res.status(500).send({message: err.message});
    }
  
    
  }
  
  async _getSimpleBox(gmPk) {
    
    try {
      const response = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: gmPk }});
      return {gamePk: gmPk, boxscore: this.simplifyBox(response.data)};
      } catch (err) {
        console.error(`Error in _getSimpleBox: ${err}`);
      }
    }
  
  simplifyBox(bx) {
    return {
      "teams": {
        "away": {
          "team": bx.teams.away.team, 
          "teamCode": bx.teams.away.teamCode, 
          "abbreviation": bx.teams.away.abbreviation,
          "players": bx.teams.away.batters.reduce((allBatters, thisBatter)=> {
            allBatters.push(bx.teams.away.players["ID" + thisBatter]);
            return allBatters;
          }, [])
        },
        "home": {
          "team": bx.teams.home.team, 
          "teamCode": bx.teams.home.teamCode, 
          "abbreviation": bx.teams.home.abbreviation,
          "players": bx.teams.home.batters.reduce((allBatters, thisBatter)=> {
            allBatters.push(this.simplifyBatter(bx.teams.home.players["ID" + thisBatter]));
            return allBatters;
          }, [])
        }, 
        
      }
           
    }
  }
  
  simplifyBatter(batter) {
    return {
      "person": batter.person, 
      "position": batter.position, 
      "stats": {
        "batting": batter.stats.batting, 
        "fielding": batter.stats.fielding
      }, 
      "allPositions": batter.allPositions
    }
  }
  
  
  
  
  async _getBoxesForDate(dt) {
    try {
      const sched = await this._getSchedule(dt);
      if (sched) {
        return sched.dates[0].games.reduce(async (prevProm, gmRec)=> {
          const collection = await prevProm;
          const gmBox = await this._getSimpleBox(gmRec.gamePk);
            collection.push(gmBox);
          return collection;
                 
        }, Promise.resolve([]));    
      }
      
    } catch (err) {
      console.error(`Error in _getBoxesForDate: ${err}`);
    }
  }
  
  async _getBoxesHttp(req, res, next) {
    
      try {
          const boxes = await this._getBoxesForDate( req.query.date ); //await this._getGame(529572);
          return res.send(boxes);
       } catch (err) {
        console.error(`Error in getGameHttp(): ${err}`);
        return res.status(500).send({message: err.message});

      }

  }
  


  
  
  route() {
    router.get('/mlb/game/:id', (...args) => this._getBoxHttp(...args));
    router.get('/mlb2/:resource', (...args) => this._getResourceHttp(...args));
    router.get('/mlb/boxes', (...args) => this._getBoxesHttp(...args));
    return router;
  }
}


module.exports =  {altMlbApiController, mlbAPI} //mlbAPI
