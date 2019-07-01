class StatlineModel {
  constructor(
    public player: Object, 
    public mlbId: string, 
    public gameDate: string, 
    public gamePk: string, 
    public stats: Object, 
    public positions: string[],
    public id?: string,
    public ablGame?: string
  ) { }
}

export { StatlineModel };