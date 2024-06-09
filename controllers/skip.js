/*jshint esversion: 8 */
const Skip = require('../models/draft').Skip;
const BaseController = require('./base.controller');
const AblTeam = require('./../models/owner').AblTeam;

class SkipController extends BaseController {

  constructor() {
    super(Skip, 'skips');
  }
  // async _create(req, res, next) {

  //   try {
  //     console.log(`Looking for team based on ${req.body.ablTeam}`)
  //     let tm = await AblTeam.findOne({nickname : req.body.ablTeam})
  //     console.log(`Found Team when searching for ${req.body.ablTeam}`)
  //     this.model.create( {ablTeam: tm._id}, function (err, post) {
  //       if (err) return next(err);
  //       res.json(post);
  //     });
  //   } catch (err) {
  //     console.log("NOPE - Didn't work. ")
  //   }

  // }

}




module.exports = SkipController

