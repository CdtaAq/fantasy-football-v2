import { getRepository } from "typeorm";
import { Team } from "../../db/entity/Team";
import { Matchup } from "../../db/entity/Matchup";
import { LeaderboardService } from "../leaderboard/leaderboard.service";

/**
 * Simple single-elimination bracket generator:
 * - takes top N teams (power of two) from standings
 * - generates round 1 pairings: 1 vs N, 2 vs N-1, etc.
 */
export class PlayoffService {
  private teamRepo = getRepository(Team);
  private matchupRepo = getRepository(Matchup);
  private lb = new LeaderboardService();

  async createPlayoffs(leagueId: string, teamsCount: number) {
    // compute standings
    const standings = await this.lb.getStandings(leagueId);
    const top = standings.slice(0, teamsCount);
    if (top.length < teamsCount) throw new Error("Not enough teams for playoffs");

    // seed teams into bracket: map to teamIds
    const seeded = top.map((s:any, idx:number) => ({ teamId: s.teamId, seed: idx + 1 }));

    // create round 1 matchups
    const rounds: Matchup[][] = [];
    const round1: Matchup[] = [];

    for (let i = 0; i < teamsCount / 2; i++) {
      const homeSeed = seeded[i];
      const awaySeed = seeded[teamsCount - 1 - i];
      const match = this.matchupRepo.create({
        leagueId,
        week: 999, // special playoff week or track differently
        teamHomeId: homeSeed.teamId,
        teamAwayId: awaySeed.teamId,
        completed: false
      });
      round1.push(await this.matchupRepo.save(match));
    }

    rounds.push(round1);
    // we only create round1; future rounds are generated after winners are known (you can extend)
    return { rounds };
  }

  async getPlayoffMatchups(leagueId: string) {
    // return matchups with week >= 900 (playoffs marker)
    return this.matchupRepo.find({ where: { leagueId } });
  }
}
