const request = require('request');

request('https://secure-taiga-96671.herokuapp.com/api3/mlbGame/2019-04-21', function(err, resp, body) {
  console.error('error:', err);
  console.log('statusCode:', resp && resp.statusCode);
  console.log('body:', body);
});