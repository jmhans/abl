/*jshint esversion: 6 */

const request = require('request');
const AblTeam = require('./../models/owner').AblTeam;
const Owner = require('./../models/owner').Owner;
const AblRosterRecord = require('./../models/owner').AblRosterRecord;
const sgMail = require('@sendgrid/mail');

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
            //Send an email invitation with the right link.
            
            // using SendGrid's v3 Node.js Library
            // https://github.com/sendgrid/sendgrid-nodejs

//             sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
//             const msg = {
//               to: owner.email,
//               from: 'jmhans@hotmail.com',
//               subject: 'Sending with SendGrid is Fun',
//               text: 'and easy to do anywhere, even with Node.js',
//               html: '<strong>and easy to do anywhere, even with Node.js</strong>' + JSON.stringify(team),
//             };
//             sgMail.send(msg);
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
  }

}


module.exports = AblTeamController