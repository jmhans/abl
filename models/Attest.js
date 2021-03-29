let mongoose = require('mongoose');
let Game = require('./Game');

const Schema = mongoose.Schema;

var AttestationSchema = new Schema({
  owner: {type: String}, 
  ablGame: {type: Schema.Types.ObjectId, ref: 'Game', required: false},
  response: {type: String}, 
  date: {type: Date}
})


module.exports =  mongoose.model('Attestation', AttestationSchema);
