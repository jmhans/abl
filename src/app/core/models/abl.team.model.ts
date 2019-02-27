class AblTeamModel {
    constructor(
    public nickname: string,  
    public location: string, 
    public stadium: string,
    public owner: Object,
    public _id?: string,
  ) { }
}
class FormTeamModel {
  constructor(
    public nickname: string,
    public location: string,
    public stadium: string, 
    public owner: Object
  ) { }
}

export { AblTeamModel, FormTeamModel };