interface OwnerInterface {
  userId: string;
  name: string;
  email: string;
  verified: boolean;
  _id?: string;
}

class AblTeamModel {
    constructor(
    public nickname: string,  
    public location: string, 
    public stadium: string,
    public owners: OwnerInterface[],
    public roster?: Object, // Might need to delete this line - I think roster comes from somewhere else now. 
    public _id?: string,
  ) { }
}
class FormTeamModel {
  constructor(
    public nickname: string,
    public location: string,
    public stadium: string, 
    public owners: OwnerInterface[]
  ) { }
}




export { AblTeamModel, FormTeamModel, OwnerInterface  };