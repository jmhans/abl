
class MlbPlayerModel {
  constructor(
    public name: string,
    public mlbID: string,
    public position: string,
    public commish_position: string, 
    public team: string,
    public status: string,
    public stats: Object,
    public games: Object[], 
    public positionLog: Object,
    public ablstatus: Object,
     public _id?: string , 
     public draftMe?: boolean
    
  ) { }
}

export { MlbPlayerModel };
