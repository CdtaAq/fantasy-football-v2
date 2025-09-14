// backend/src/api/waivers/waiver.service.ts
import { getRepository } from "typeorm";
import { Team } from "../../db/entity/Team";
import { Player } from "../../db/entity/Player";
import { League } from "../../db/entity/League";

export class WaiverService {
  // For this simple implementation: teams submit requests stored in DB or in-memory.
  // We'll keep a simple table-less FIFO using Redis list in production; here keep in-memory map or simple file.
  // For time, implement a REST endpoint that immediately processes a pickup if player is free.

  async requestPickup(leagueId: string, teamId: string, playerId: string) {
    // verify player not on another roster
    const teams = await getRepository(Team).find({ where: { leagueId } });
    const taken = teams.some(t => (t.roster || []).includes(playerId));
    if (taken) throw new Error("Player already rostered");
    // immediately assign (no priority) — replace with batch resolution later
    const team = await getRepository(Team).findOne({ where: { id: teamId } });
    team.roster = [...(team.roster || []), playerId];
    await getRepository(Team).save(team);
    return { ok: true };
  }
}
