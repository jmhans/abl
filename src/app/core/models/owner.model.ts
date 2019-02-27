class OwnerModel {
    constructor(
    public name: string, 
    public email: string,
    public teams: TeamModel[],
    public _id?: string
  ) { }
}

class TeamModel {
  _id?: string;
  name: string;
} 

export { OwnerModel, TeamModel };