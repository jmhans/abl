
class MlbPlayerModel {
  constructor(
    public name: string,
    public mlbID: string,
    public position: string,
    public team: string,
    public status: string,
    public stats: Object,
    public _id?: string
  ) { }
}

export { MlbPlayerModel };