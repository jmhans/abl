/*jshint esversion: 8 */

const axios = require('axios');
var   express = require('express');
var   router = express.Router();
const BASE_URL = "https://statsapi.mlb.com/api/v1";//"http://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
const mlbGame = require('./../models/mlbGame').mlbGame;
const player = require('./../models/player').Player;
const mlbRoster = require('./../models/mlbRoster');
const GameLoadView = require('./../models/mlbGame').mlbGameLoad;


const BaseController = require('./base.controller');

const ablConfig = require('./../server/ablConfig');

var   StatlineController = require('../controllers/statline.controller');
var   PlayersController = require('../controllers/players.controller');

const dotenv = require('dotenv');

var result = dotenv.config();

let currentURLDomain = process.env.DOMAIN


    var pad = function(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }


class altMlbApiController extends BaseController{

  constructor() {
    super(mlbGame, 'mlbgame');
    this.PlyrCntl = new PlayersController();
  }

  async _getGames(req, res, next) {
    try {
      const games = await this._getGamesForDate(req.params.gm_dt);
      return res.send({'message': 'Loading games on server side. See server logs for more infromation.' , 'games': games});
    } catch (err) {
      return res.status(500).send({message: err.message});
    }
  }

  async _refreshRosters(req, res, next) {
    try {
      const rosters = await this.getAllRosters();
      return res.send(`${rosters.length} rosters updated.`);
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
        const gameLoad = this._loadGamesToDB(gamesList, year+'-'+month+'-'+day); // Do not await this. Requests will time out. The load processes carry on behind the scenes.

      }
      return gamesList

    } catch(err) {
      console.error(`Error in _getGames: ${err}`)
    }
  }

  async _loadGamesToDB(gamesList, gmDtString) {
    try {

      var returnArr = []

      for (var g=0; g<gamesList.length; g++ ){
        var gm = gamesList[g]
        var query = {
          'gamePk': gm.gamePk
        };
        mlbGame.findOneAndUpdate(query, gm, {
          upsert: true
        }, function(err, doc) {
          if (err) return res.send(500, {
            error: err
          });

        });

        if (gm.status.codedGameState != 'D') {
          const plyrLoad = await this.loadPlayersInGame(gm);

          returnArr.push(plyrLoad)
        }
      }

      // Update all position logs.
      const posLog = await new StatlineController()._genPositionLog();
      // Process Games for date.
      const APIUrl = currentURLDomain + "/api2/games/process/" + gmDtString;
      const getResponse = await axios.get(APIUrl)


      return returnArr

    } catch(err) {
      console.error(`Error in _loadGamesToDB: ${err}`)
    }
  }

  async handleLoadPlayersResponse(body, gm) {
    try {
      const awayPlayers = await this.loadTeamPlayers(body.teams, "away", gm);
      const homePlayers = await this.loadTeamPlayers(body.teams, "home", gm);
      console.log(awayPlayers.length + " away team players and " + homePlayers.length + " home team players logged.")
      return {away: awayPlayers, home: homePlayers};

    } catch (err) {

    }
   }


 async loadPlayersInGame(gm) {
    const APIUrl = BASE_URL + "/game/" + gm.gamePk + "/boxscore";
    try {
      const getResponse = await axios.get(APIUrl)
      console.log(`Received data from ${APIUrl}`)
//      console.log(getResponse)
      const resp = await this.handleLoadPlayersResponse(getResponse.data, gm)
      return resp

    } catch (err) {
      console.error(err);

    }
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

 async getRosterInfo(tm) {

        try {

        const APIUrl = BASE_URL + `/teams/${tm.id}/roster?rosterType=40Man`  ;
       var retBody = await axios.get(APIUrl);
        let rosterContent =retBody.data
        rosterContent.team = tm
        rosterContent.lastUpdate = new Date()
       return retBody.data
     } catch (err) {
       console.error(`Error in getRosterInfo: ${err}; URL: ${APIUrl}`)
     }
 }

   async getAllTeams() {
     try {
       const APIUrl = BASE_URL + "/teams?sportId=1" ;
       var retBody = await axios.get(APIUrl);
       return retBody.data.teams
     } catch (err) {
       console.error(`Error in getAllTeams: ${err}; URL: ${APIUrl}`)
     }

 }

 async getAllRosters() {
   try {
     var output = []

        const teams = await this.getAllTeams();

        for (var t=0; t<teams.length; t++) {
          var resp = await this.getRosterInfo(teams[t])

          const rQuery = {teamId: teams[t].id}

          const upsertedRoster = await mlbRoster.findOneAndUpdate(rQuery, resp, {upsert: true});
          output.push(upsertedRoster);
        }
        return output;

      } catch (err) {
              console.error(`Error in getAllRosters: ${err}`)

      }

 }
 async _getRosters(req, res, next) {
  try {
    const rosters = await mlbRoster.find({});
    return res.send(rosters);
  } catch (err) {
    return res.status(500).send({message: err.message});
  }
}
async _getLoadData(req, res, next) {
  try {
    const rosters = await GameLoadView.find({});
    return res.send(rosters);
  } catch (err) {
    return res.status(500).send({message: err.message});
  }
}

  route() {
    router.get('/' + this.routeString + '/:gm_dt' , (...args) => this._getGames(...args));
    router.get('/mlb/rosters', (...args)=> this._refreshRosters(...args));
    router.get('/mlbRosters', (...args)=> this._getRosters(...args));
    router.get('/mlbLoads', (...args)=> this._getLoadData(...args))
    return router;
  }

}


module.exports =  {altMlbApiController} // , mlbAPI} //mlbAPI
