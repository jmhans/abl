import { AblTeamModel } from './abl.team.model'
import { MlbPlayerModel } from './mlb.player.model'


class DraftPickModel {
    constructor(
    public season: string,
    public draftType: string,
    public pickTime: Date,
    public ablTeam: string | AblTeamModel,
    public player?: string | MlbPlayerModel,
    public _id?: string,
  ) { }
}

export { DraftPickModel };
