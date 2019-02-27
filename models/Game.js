const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
  gameDate: { type: Date, required: true },
  awayTeam: { type: Schema.Types.Mixed, required: true}, 
  homeTeam: { type: Schema.Types.Mixed, required: true}, 
  description: String,
});

module.exports = mongoose.model('Game', gameSchema);
