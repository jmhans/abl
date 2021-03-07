const request = require('request');


var today = new Date("2019-07-23")

var pad = function(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}


var day = pad(today.getUTCDate()-1, 2); 
var month = pad(today.getUTCMonth() + 1, 2);
var year = today.getUTCFullYear();

request('https://secure-taiga-96671.herokuapp.com/api2/mlbGame/' + year + '-' + month + '-' + day, function(err, resp, body) {
  console.error('error:', err);
  console.log('statusCode:', resp && resp.statusCode);
  if (resp.statusCode == 200) {
    console.log(JSON.parse(body).length + " records added");
  }
  
});


