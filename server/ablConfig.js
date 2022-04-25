
function _isPositionPlayer(plyr) {
  
  if (plyr.allPositions) { 
    
    const nonPitcherPosList = plyr.allPositions.filter((posRec) => {return posRec.abbreviation != 'P'});

    return (nonPitcherPosList.length > 0);
  }
  return false;
}


module.exports = {
  POSITION_MAP : { 'LF': 'OF', 
                  'RF': 'OF', 
                  'CF': 'OF',
                  'PR': '',
                  'PH': ''
                      
                 },
  POSSIBLE_POSITIONS : ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH'], 
  QUALIFYING_GAMES_FOR_POSITION : 10, 
  _isPositionPlayer : _isPositionPlayer
}