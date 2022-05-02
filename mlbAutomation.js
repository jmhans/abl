const axios = require('axios').default;


var today = new Date()

var pad = function(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}


var day = pad(today.getUTCDate()-1, 2);
var month = pad(today.getUTCMonth() + 1, 2);
var year = today.getUTCFullYear();

function _updatePositionsLog() {

  axios.get('https://abl-prod.herokuapp.com/api3/positionlogs')
  .then(function (resp) {
    // handle success
    console.log('PosLog statusCode:', resp && resp.status);
    if (resp.status == 200) {
      console.log('Positions Log Updated');
    }

  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
  .then(function () {
    // always executed
  });
}



/* axios.get('https://abl-prod.herokuapp.com/api2/mlbGame/'+ year + '-' + month + '-' + day)
  .then(function (resp) {
    // handle success
    console.log('Game Score statusCode:', resp && resp.status);
    if (resp.status == 200) {

      console.log(`${JSON.parse(body).length} records added for ${year + '-' + month + '-'+ day}`);
      console.log(`${resp.body}`);
      _updatePositionsLog()
    }
  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
  .then(function () {
    // always executed
  }); */

  axios.get('https://abl-jmhans33439.codeanyapp.com/api2/mlbGame/'+ year + '-' + month + '-' + day)
  .then(function (resp) {
    // handle success
    console.log('Game Score statusCode:', resp && resp.status);
    if (resp.status == 200) {
      console.log(`${resp.data.length} records added for ${year + '-' + month + '-'+ day}`);
      _updatePositionsLog()
    }
  })
  .catch(function (error) {
    // handle error
    console.error(error);
  })
  .then(function () {
    // always executed
  });




