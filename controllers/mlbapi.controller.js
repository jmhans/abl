/*jshint esversion: 6 */

const request = require('request');
const BASE_URL = "http://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
const mlbGame = require('./../models/mlbGame');
const Player = require('./../models/player').Player;
const POSITION_MAP = { 'LF': 'OF', 
                  'RF': 'OF', 
                  'CF': 'OF',
                  'PR': '',
                  'PH': ''
                 }
  
  
  
function _isPositionPlayer(plyr) {
  
  if (plyr.allPositions) { 
    
    nonPitcherPosList = plyr.allPositions.filter((posRec) => {return posRec.abbreviation != 'P'});

    return (nonPitcherPosList.length > 0);
  }
  return false;
}


function appendPlayerRecord(player, team, gamePk, gameDt) {
    if (_isPositionPlayer(player)) {
   
      var query = {
        'mlbID': player.person.id
      }
      Player.findOne(query).exec((err, _playerRecord) => {
          if (_playerRecord) {
            // We have a player record.
            var playerGame = _playerRecord.games.find((gm) => {return gm.gamePk == gamePk})
            if (playerGame) {
              // Game record already exists for player. Update it. 
              playerGame.stats = player.stats;
              playerGame.positions = player.allPositions;
            } else {
              _playerRecord.games.push({gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: player.allPositions.map((pos) => {return pos.abbreviation;})})
 
            }

          } else {
            // Create a new player record. 
              _playerRecord = new Player({
                mlbID: player.person.id,
                lastUpdate: '', 
                games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: player.allPositions.map((pos) => {return pos.abbreviation;})}],
                positionLog : []
              })
          }
          if (gameDt >= _playerRecord.lastUpdate) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation; 
                _playerRecord.status = player.status.description; 
                _playerRecord.stats = player.seasonStats; 
                _playerRecord.position = player.position.abbreviation;
                _playerRecord.lastUpdate = gameDt;
            
               // _playerRecord.positionLog = player.allPositions.reduce(updatePosLog, _playerRecord.positionLog) //incrementArrayItems(_playerRecord.positionLog, posLog);
          }
          // Update positionLog based on gamecounts
          _playerRecord.positionLog = _playerRecord.games.reduce(calcPosLog, []);
          _playerRecord.save((err) => {
            if (err) {

            }
            //return res.send("successfully saved");
          });

      })
      
      

    }  
}

function calcPosLog(preLog, gameRec) {
  for( posRec=0; posRec < gameRec.positions.length; posRec++) {
    var translatePos = POSITION_MAP[gameRec.positions[posRec]];
  
    if (typeof(translatePos) == 'undefined') { translatePos = gameRec.positions[posRec];}

    if (translatePos != ''){

      logRec = preLog.find((logItem) => logItem.position == gameRec.positions[posRec]);
      if (logRec) {
        logRec.ct++
      } else {
        preLog.push({position: gameRec.positions[posRec], ct: 1})
      }
    }
  }
  return (preLog) ;
}

function updatePosLog(prePosLog, posRecord) {
  var translatePos = POSITION_MAP[posRecord.abbreviation];
  
  if (typeof(translatePos) == 'undefined') { translatePos = posRecord.abbreviation;}
  
  if (translatePos != ''){
    var logRecord = prePosLog.find((itm)=> { return itm.position == translatePos;});
      if (!logRecord) { 
        prePosLog.push({position: translatePos, ct: 1})
      } else
      {
        logRecord.ct++;
      }
  }
    
  return prePosLog;
}


function getPlayersInGame(gamePk, gameDt) {
    const APIUrl = BASE_URL + "/game/" + gamePk + "/boxscore";
    request(APIUrl, {
      json: true
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
    
      function getTeamPlayers(teamType) {
        var PositionPlayers = []
        var players = body.teams[teamType].players

        var team = body.teams[teamType].team

        
        for (var playerKey in players) {
          let player = players[playerKey]
          appendPlayerRecord(player, team, gamePk, gameDt);
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
    var day = pad(inputDate.getDate()+1, 2);
    var month = pad(inputDate.getMonth() + 1, 2);
    var year = inputDate.getFullYear();
    
    const APIUrl = BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day + "%2F" + year
    request(APIUrl, {
      json: true
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
      //console.log(body);

      var gamesList = [];
      var dateItem = body.dates.find(x => x.date == (year + "-" + month + "-" + day))

      if (dateItem) {
        gamesList = dateItem.games

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
        getPlayersInGame(gm.gamePk, gm.gameDate);

        });
        
      }

      res.status(200).send(gamesList);
    })

  }, 

}


module.exports = MlbApiController
