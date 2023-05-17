const BaseController = require('./base.controller');
const Team = require('../models/owner').AblTeam;
const Game = require('../models/Game');
const StandingView = require('../models/standings');

class StandingsController extends BaseController {

  constructor() {
    super(Team, 'standings')
  }

  _get(req, res, next) {


    StandingView.find({}).exec((err, standings) => {
        if (err)
          return next(err);
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



        res.send(standings);
      } );
  }

  _get(req, res, next) {


    StandingView.find({}).exec((err, standings) => {
        if (err)
          return next(err);
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



        res.send(standings);
      } );
  }

  reroute() {
    router = this.route();
    router.get('/advancedstandings' , (...args) => this._getAdvanced(...args));
    return router;
  }

}

module.exports = StandingsController
