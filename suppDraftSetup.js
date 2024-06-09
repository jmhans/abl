const axios = require('axios').default;
const dotenv = require('dotenv');

var result = dotenv.config();

currentURLDomain = process.env.DOMAIN // 'https://abl-jmhans33439.codeanyapp.com'
//currentURLDomain = 'https://abl-prod.herokuapp.com'

  axios.get(currentURLDomain + '/api2/dropallPickups')
  .then(async function (resp) {
    // handle success
    try{
      console.log('Pickups Dropped');
      if (resp.status == 200) {

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




