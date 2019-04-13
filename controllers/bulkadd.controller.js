const https = require('https');

const Player = require('./../models/player').Player;
const Statline = require('./../models/statline');
const AblGame = require('./../models/Game');

const gamesList = require("./../data/gamesList.json");


var BulkAddController = {
  _addGames : function() {
    console.log(gamesList);
    console.log(Array.isArray(gamesList));
    
    if (Array.isArray(gamesList)) {
      gamesList.forEach((gm) => {
        AblGame.findOne({
          awayTeam: gm.awayTeam,
          homeTeam: gm.homeTeam,
          gameDate: gm.gameDate
          }, (err, existingGame) => {
          if (err) {
            console.log("err: " + JSON.stringify(gm))
            return ''
          }
          if (existingGame) {
            console.log("dupe: " + JSON.stringify(gm))
            return ''
          }
          const game = new AblGame({
            awayTeam: gm.awayTeam,
            homeTeam: gm.homeTeam, 
            gameDate: gm.gameDate, 
            description: gm.description || ''
          });
          game.save((err) => {
            if (err) {
              return (err)
            }
            console.log("Created: " + JSON.stringify(gm))
          });
        });
      })
    }
    
  }, 
  _getFile: function(req, res) {
    const fl = req.params.flname;
    const data = require('./../data/' + fl + ".json");
    if (data) {
      res.send(data)
    }
  }
  
  
}
module.exports = BulkAddController
