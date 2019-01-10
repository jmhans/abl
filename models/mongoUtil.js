var MongoClient = require( 'mongodb' ).MongoClient;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    console.log("inside mongoUtil");
    MongoClient.connect( "mongodb://localhost:27017", function( err, db ) {
      console.log("inside mongoUtil.connect");
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};