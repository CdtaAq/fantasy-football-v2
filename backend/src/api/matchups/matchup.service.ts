// backend/src/api/matchups/matchup.service.ts
import { getRepository } from "typeorm";
import { Team } from "../../db/entity/Team";
import { Matchup } from "../../db/entity/Matchup";

export class MatchupService {
  private teamRepo = getRepository(Team);
  private matchupRepo = getRepository(Matchup);

  // round-robin pairing for one week: simple pair adjacent teams in current ordering
  async generateWeek(leagueId: string, week: number) {
    const teams = await this.teamRepo.find({ where: { leagueId }, order: { draftPosition: "ASC" } });
    if (teams.length % 2 !== 0) throw new Error("Teams must be even to pair for matchups");
    const created: Matchup[] = [];
    for (let i = 0; i < teams.length; i += 2) {
      const m = this.matchupRepo.create({
        leagueId,
        week,
        teamHomeId: teams[i].id,
        teamAwayId: teams[i + 1].id,
        completed: false
      });
      created.push(await this.matchupRepo.save(m));
    }
    return created;
  }

  async getMatchups(leagueId: string, week: number) {
    return await this.matchupRepo.find({ where: { leagueId, week } });
  }
}
