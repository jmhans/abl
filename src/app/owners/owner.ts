export class Owner {
  _id?: string;
  name: string;
  email: string;
  teams: Team[];
}

export class Team {
  _id?: string;
  name: string;
}
