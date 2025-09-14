// backend/src/api/leaderboard/leaderboard.service.ts
import { getRepository } from "typeorm";
import { League } from "../../db/entity/League";
import { Team } from "../../db/entity/Team";
import { Matchup } from "../../db/entity/Matchup";

export class LeaderboardService {
  private teamRepo = getRepository(Team);
  private matchupRepo = getRepository(Matchup);

  async getStandings(leagueId: string) {
    const teams = await this.teamRepo.find({ where: { leagueId } });
    const standings = teams.map(t => ({ teamId: t.id, teamName: t.name, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 }));
    const map = new Map(standings.map(s => [s.teamId, s]));

    const matchups = await this.matchupRepo.find({ where: { leagueId, completed: true } });
    for (const m of matchups) {
      const home = map.get(m.teamHomeId);
      const away = map.get(m.teamAwayId);
      if (!home || !away) continue;
      home.pointsFor += m.scoreHome;
      home.pointsAgainst += m.scoreAway;
      away.pointsFor += m.scoreAway;
      away.pointsAgainst += m.scoreHome;
      if (m.scoreHome > m.scoreAway) {
        home.wins += 1; away.losses += 1;
      } else if (m.scoreAway > m.scoreHome) {
        away.wins += 1; home.losses += 1;
      } else {
        home.ties += 1; away.ties += 1;
      }
    }

    // sort by wins desc, pointsFor desc, pointsAgainst asc
    return Array.from(map.values()).sort((a,b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      return a.pointsAgainst - b.pointsAgainst;
    });
  }
}
