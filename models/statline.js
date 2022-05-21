let mongoose = require('mongoose');
let Player = require('./player').Player;
let Game = require('./Game');
let axios = require('axios');

const dotenv = require('dotenv');

var result = dotenv.config();
currentURLDomain = process.env.DOMAIN // 'https://abl-jmhans33439.codeanyapp.com'

const Schema = mongoose.Schema;

var statLineSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player', required: false},
  mlbId: {type: String, required: true},
  gameDate: {type: Date, required: true},
  gamePk: {type: String, required: false},
  stats: {type: Schema.Types.Mixed, required: false},
  positions: [{type: String, required: false}],
  ablGame: {type: Schema.Types.ObjectId, ref: 'Game', required: false},
  statlineType: {type: String, required: false},
  updatedStats: {type: Schema.Types.Mixed, required: false}
})


// statLineSchema.post('updateMany', async function(qry) {
// //  console.log('%s has completed', qry);

//   try {

//       if(qry.modifiedCount + qry.upsertedCount > 0) {
//         const APIUrl = `${currentURLDomain}/api2/position_log/${qry.upsertedId}?year=2022`  ;
//         if (!APIUrl) {
//           console.log( `Cur Domain: ${currentURLDomain}`)
//           console.log( `Qry: ${qry}`)
//         }
//         var retBody = await axios.get(APIUrl);
//         console.log(retBody.data)
//         return retBody.data

//       }

//   } catch (err) {
//     console.error(`Error in statlinePostMiddleware: ${err}; URL: ${APIUrl}`)
//   }


// })


const Statline = mongoose.model('Statline', statLineSchema);

module.exports =  Statline ;
