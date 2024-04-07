const https = require('https');

const Player = require('./../models/player').Player;
const Statline = require('./../models/statline').Statline;
const AblGame = require('./../models/Game');

const gamesList = require("./../data/gamesList.json");

class BaseHandler {
  constructor() {
    this.model = ''
    }

  _postData(req, res, next) {
  // req.params.model is the model to use.

    switch(req.params.model) {
      case 'games':
        this.model = require('./../models/Game');
        break;
      case 'lineups':
        this.model = require('./../models/lineup').Lineup;
        break;
      default:

    }



    var promArr = [];

    if (Array.isArray(req.body)) {
      req.body.forEach((itm) => {
        var prom = new Promise((resolve, reject) => {
          this.model.create(itm, (err, post) => {
            if (err) reject();
            resolve(post);
          })
        })
        promArr.push(prom);
      })
    } else {
      var prom = new Promise((resolve, reject)=> {
        this.model.create(req.body, (err, post) => {
          if (err) reject();
          resolve(post)
        })
      })
      promArr.push(prom)
    }

    Promise.all(promArr).then((values) => {
      res.json(values)
    })


  }

}




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
module.exports = {BulkAdd: BulkAddController, BulkLoad: BaseHandler}
