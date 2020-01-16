const Player = require('../models/player').Player;
const BaseController = require('./base.controller');

const ablConfig = require('../server/ablConfig');



class PlayersController extends BaseController {

  constructor() {
    super(Player, 'players');
  }
  
  async _updatePlayer(player,team, gm) {
    
    if (ablConfig._isPositionPlayer(player)) {
   
      var query = {
        'mlbID': player.person.id
      }
      var shortPositions = player.allPositions.map((pos) => {return pos.abbreviation;})
      
      try {
        var _playerRecord = await this.model.findOne(query);
        
          if (_playerRecord) {

          } else {
            // Create a new player record. 
              _playerRecord = new this.model({
                mlbID: player.person.id,
                lastUpdate: '', 
                //games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: shortPositions}],
                //positionLog : []
              })
          }
          if (gm.gameDate >= _playerRecord.lastUpdate) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation; 
                _playerRecord.status = player.status.description; 
                _playerRecord.stats = player.seasonStats; 
                _playerRecord.position = ablConfig.POSITION_MAP[player.position.abbreviation] || player.position.abbreviation;
                _playerRecord.lastUpdate = gm.gameDate;
            
          }
          
        const newRec = await _playerRecord.save();
        return _playerRecord;
      } catch (err) {
        console.error(`Error in _updatePlayer:${err}`)
      }

      
      

    }  
  }
  
  
}

module.exports = PlayersController

