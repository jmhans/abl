const axios = require('axios').default;
const dotenv = require('dotenv');
const { expressjwt: jwt} = require('express-jwt');
const jwks = require('jwks-rsa');
const config2 = require('./server/config');
var mongoose = require('mongoose');
var parseArgs = require('minimist')

let args = parseArgs(process.argv.slice(2));
var GameController = require('./controllers/abl.game.controller');
let someGame = require('./models/Game').Game

var gc = new GameController();
var result = dotenv.config();
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true,useUnifiedTopology: true});

currentURLDomain = process.env.DOMAIN // 'https://abl-jmhans33439.codeanyapp.com'
//currentURLDomain = 'https://abl-prod.herokuapp.com'


var today = new Date()

var pad = function(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}


var day = pad(today.getUTCDate()-1, 2);
var month = pad(today.getUTCMonth() + 1, 2);
var year = today.getUTCFullYear();


function convertRosterScores(players, team,  location, score) {
  return {
    players: players,
    team: team,
    location: location,
    regulation: score.regulation,
    final: score.final
  }
}



async function _createGameResult(gmId) {
try {
  const gm = await gc._getByIdBackend(gmId);
  console.log(gm)

  var rosters = await gc._getRostersForGame(gmId)
  if (rosters) {
    const gameContent =rosters //.data
    const live_result = {
      status: gameContent.status,
      scores: [convertRosterScores(gameContent.homeTeam, gm.data.homeTeam._id, 'H', gameContent.home_score), convertRosterScores(gameContent.awayTeam, gm.data.awayTeam._id, 'A', gameContent.away_score)],
      winner: gameContent.result.winner,
      loser: gameContent.result.loser,
      attestations: []
    }
    var saveResults = await gc._updateResultsServer(gmId, live_result);


    console.log(`Game result saved: ${gmId}`);
  }
  return 'Complete'

} catch(err) {
  console.error(err);

}


}

async function processAll(toDt) {
  try {
    let gms = await gc.getAllUnprocessedGames(toDt);
    for (let g=0; g<gms.length; g++) {
      _createGameResult(gms[g]._id)

    }

    console.log(`${gms.length} game results saved.`)



  } catch(err) {
    console.error(err)
  }

}


let myDt = args.gameDate ? new Date(args.gameDate) : new Date()
if (args.gameDate) {
  myDt = new Date((new Date(myDt)).setDate(myDt.getDate() +1))
}


processAll(myDt);







