const axios = require('axios').default;
const dotenv = require('dotenv');

var result = dotenv.config();

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

async function _updatePositionsLog() {

  axios.get(currentURLDomain + '/api3/positionlogs')
  .then(function (resp) {
    // handle success
    console.log('PosLog statusCode:', resp && resp.status);
    if (resp.status == 200) {
      console.log('Positions Log Updated');
    }
    return 'Complete'
  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
  .then(function () {
    // always executed
  });
}

async function _updateRosterStatus() {
  axios.get(currentURLDomain + '/api2/mlb/rosters')
  .then(function (resp) {
    // handle success
    console.log('Roster statusCode:', resp && resp.status);
    if (resp.status == 200) {
      console.log('Roster statuses actively being updated');
    }
    return 'Complete'
  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
}


  axios.get(currentURLDomain + '/api2/mlbGame/'+ year + '-' + month + '-' + day)
  .then(async function (resp) {
    // handle success
    try{
      console.log('Game Score statusCode:', resp && resp.status);
      if (resp.status == 200) {
        console.log(`${resp.data.games.length} games found for ${year + '-' + month + '-'+ day}; Server working on obtaining player information.`);
        //const pos = await _updatePositionsLog()
        const ros = await _updateRosterStatus()
      }
    } catch(err) {
      console.error(err);
    }

  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
  .then(function () {
    // always executed
  });




