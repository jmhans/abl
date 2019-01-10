var MongoClient = require( 'mongodb' ).MongoClient;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    console.log("inside mongoUtil");
    MongoClient.connect( "mongodb://localhost:27017", function( err, client ) {
      console.log("inside mongoUtil.connect");
      _db = client.db();
      return callback( err );
    } );
  },

  getDb: function() {
    console.log("got into getDb")
    return _db;
  }
};