const Owner = require('../models/owner');
const BaseController = require('./base.controller');
const request = require('request');


class OwnersController extends BaseController {

  constructor() {
    super(Owner.Owner, 'owners');
  }
  
//   _get(req, res, next) {
//     this.model.find(function(err, results) {
//       if (err) return next(err);
//       res.json(results);
//     });
//     }
  
//   route() {
//     router.get('/' + this.routeString, jwtCheck, (...args) => this._get(...args));
//     router.post('/' + this.routeString , (...args) => this._create(...args));
//     router.get('/' + this.routeString + '/:id', (...args) => this._getOne(...args));
//     router.put('/' + this.routeString + '/:id', (...args) => this._update(...args));
//     router.delete('/' + this.routeString + '/:id', (...args) => this._delete(...args));
//     return router;
//   }

  }

class TeamsController extends BaseController {
  constructor() {
    super(Owner.Team, 'teams')
  }

}

module.exports = { OwnersController: OwnersController, TeamsController: TeamsController}






