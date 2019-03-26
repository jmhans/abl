/*jshint esversion: 6 */

const request = require('request');
const BASE_URL = "http://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
const mlbGame = require('./../models/mlbGame');
const Player = require('./../models/player').Player;


  function getPlayersInGame(gamePk) {
    const APIUrl = BASE_URL + "/game/" + gamePk + "/boxscore";
    request(APIUrl, {
      json: true
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
      
      function _isPositionPlayer(plyr) {
        if (plyr.allPositions) { 
            for (var p = 1; p<plyr.allPositions.length; p++) {
                if (plyr.allPositions[p].abbreviation != "P") {
                  return true;
                }
            }
          }
        return false;
      }
     
      
      
      
      function getTeamPlayers(teamType) {
        var PositionPlayers = []
        var players = body.teams[teamType].players

        var team = body.teams[teamType].team

        
        for (var playerKey in players) {

          let player = players[playerKey]
          if (_isPositionPlayer(player)) {
            var query = {
              'mlbID': player.person.id
            }
            const plyr = {
              $set: {
                mlbID: player.person.id,
                position: player.position.abbreviation,
                name: player.person.fullName, 
                team: team.abbreviation, 
                status: player.status.description, 
                stats: player.seasonStats, 
                allPositions: player.allPositions
              }
            }
            Player.findOneAndUpdate(query, plyr, {
              upsert: true
            }, function(err, doc) {
            if (err) console.log(err);

            //return res.send("succesfully saved");
          })
          }
          
        }
      }
      
      getTeamPlayers("away");
      getTeamPlayers("home");
      


    })


  }



var MlbApiController = {

  _get: function(req, res, next) {

    var pad = function(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }

    const gm_date = req.params.dt;

    var inputDate = new Date(gm_date)
    var day = pad(inputDate.getDate(), 2);
    var month = pad(inputDate.getMonth() + 1, 2);
    var year = inputDate.getFullYear();

    const APIUrl = BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day + "%2F" + year

    request(APIUrl, {
      json: true
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
      const gamesList = body.dates.find(x => x.date == (year + "-" + month + "-" + day)).games

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
      getPlayersInGame(gm.gamePk);
          
      });
      res.status(200).send(gamesList);
    })

  }, 

}


module.exports = MlbApiController
