const BaseController = require('./base.controller');
const Team = require('../models/owner').AblTeam;
const Game = require('../models/Game').Game;
const StandingView = require('../models/standings');
let StandingsPipeline = require('../models/standingsPipeline')

class StandingsController extends BaseController {

  constructor() {
    super(Team, 'standings')
  }

  async _get(req, res, next) {

    try {
      let response = await this._getBackend(req.query)
      res.send(response);
    } catch(err) {
      return next(err);
    }
  }

  async _getBackend(qry={}){

    let modPipeline
    if (qry.asOfDate) {
        // asOfDate should be in format YYYY-MM-DD
      modPipeline =[{"$match": {"gameDate": {"$lte": new Date(qry.asOfDate + "T17:00:00Z")}}}, ...StandingsPipeline]
    } else {
      modPipeline = [...StandingsPipeline]
    }

    let standings = await Game.aggregate(modPipeline).exec()
    let scoreDateSorter = (a, b) => { return new Date(b.gameDate) - new Date(a.gameDate); };

    for (let tm = 0; tm < standings.length; tm++) {
      let outcomes = standings[tm].outcomes.sort(scoreDateSorter);
      //let scores = standings[tm].scores.sort((a,b)=> scoreDateSorter)
      //let scoresAgainst = standings[tm].scores
      let strType = outcomes[0].outcome;
      let strCount = 0;


      do {
        strCount++;
      } while ((strCount < outcomes.length) && (outcomes[strCount].outcome == strType));

      let l10 = outcomes.slice(0, 10).reduce((tot, cur) => {

        if (cur.outcome == 'w') {
          return { w: tot.w + 1, l: tot.l };
        } else {
          return { w: tot.w, l: tot.l + 1 };
        }
      }, { w: 0, l: 0 });

      standings[tm].l10 = l10;
      standings[tm].streak = { strType: strType, count: strCount, active: false };
      //console.log(standings[tm].streak);
      //console.log(outcomes.slice(0, 10));
    }
    return standings


}




  reroute() {
    router = this.route();
    router.get('/advancedstandings' , (...args) => this._getAdvanced(...args));
    return router;
  }

}

module.exports = StandingsController
