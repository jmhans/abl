var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');

var CONTACTS_COLLECTION = "contacts";
var PLAYERS_COLLECTION = "players";

var app = express();
app.use(bodyParser.json());

// Create link to Angular build directory
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

//app.use(require('./routes/routes'));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Database connection ready");
  // Initialize the app.
  var server = app.listen(process.env.PORT || 3000, '0.0.0.0', function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

})

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

var api = require('./routes/api.route');
app.use('/api', api);
app.use('/', function (req, res) {
    res.sendFile(distDir+'/index.html');
});
