/*jshint esversion: 8 */

const request = require('request');
//const Player = require('../models/player');
var express = require('express');
var router = express.Router();
const AblTeam = require('./../models/owner').AblTeam;
const Owner = require('./../models/owner').Owner;
const AblRosterRecord = require('./../models/owner').AblRosterRecord;

const BaseController = require('./base.controller');

var AblTeamController = {
  
  _getById: function(req, res) {

    AblTeam.findById(req.params.id).exec(function (err, team) {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!team) {
        return res.status(400).send({message: 'Team not found.'});
      }
      res.send(team);
    });
   
  },
  
  _getTeams: function(req, res) {
    AblTeam.find({}).exec(function (err, teams) {
      let teamsArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (teams) {
        teams.forEach(team => {
          teamsArr.push(team);
        });
      }
      res.send(teamsArr);
    });
  },
  
  _getOwners: function(req, res) {
     Owner.find({}, (err, owners) => {
      let ownersArr = [];
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (owners) {
        owners.forEach(owner => {
          ownersArr.push(owner);
        });
      }
      res.send(ownersArr);
    });
  },
  
  _post: function(req, res) {

    AblTeam.findOne({
      nickname: req.body.nickname,
      location: req.body.location,
      }, (err, existingTeam) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (existingTeam) {
        return res.status(409).send({message: 'You have already created a team with this nickname & location.'});
      }
      const team = new AblTeam({
        nickname: req.body.nickname || "Team " + req.body.owners[0].email,
        location: req.body.location, 
        stadium: req.body.stadium, 
        owners: req.body.owners
      });
      team.save((err) => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        team.owners.forEach((owner) => {
          if (!owner.verified && owner.email != '') {

             }
        })
        res.send(team);
      });
    });
    
    
  },
    
  _put: function(req, res) {
    AblTeam.findById(req.params.id, (err, team) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!team) {
        return res.status(400).send({message: 'Team not found.'});
      }
      team.nickname = req.body.nickname;
      team.location = req.body.location;
      team.stadium = req.body.stadium;
      team.owners = req.body.owners;
      
      team.save(err => {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.send(team);
      });
    });
}, 
  _delete: function(req, res) {
    AblTeam.findById(req.params.id, (err, team) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (!team) {
        return res.status(400).send({message: 'Team not found.'});
      }
        team.remove(err => {
          if (err) {
            return res.status(500).send({message: err.message});
          }
          res.status(200).send({message: 'Team successfully deleted.'});
        });
    });
  },
  


}


// class AblTeamControllerNew extends BaseController {
  
//   constructor() {
//     super(AblTeam, 'ablteams');
    
//   }
  
//   async _getGamesForTeam(tmId) {
//     try {

          

//       if (dateItem) {
//         gamesList = dateItem.games
//         this._loadGamesToDB(gamesList);
//       }
//       return gamesList
      
//     } catch(err) {
//       console.error(`Error in _getGames: ${err}`)
//     }
//   }
 
//   route() {
//     router.get('/' + this.routeString, (...args) => this._get(...args));
//     router.post('/' + this.routeString , (...args) => this._create(...args));
//     router.get('/' + this.routeString + '/:id', (...args) => this._getOne(...args));
//     router.put('/' + this.routeString + '/:id', (...args) => this._update(...args));
//     router.delete('/' + this.routeString + '/:id', (...args) => this._delete(...args));
//     return router;
//   }
// }


module.exports = AblTeamController