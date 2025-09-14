import { getRepository } from "typeorm";
import { Waiver } from "../../db/entity/Waiver";
import { Team } from "../../db/entity/Team";
import Redis from "redis";
import config from "../../config";

const redisClient = Redis.createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
redisClient.connect().catch(console.error);

export class WaiverService {
  private waiverRepo = getRepository(Waiver);
  private teamRepo = getRepository(Team);

  // submit a FAAB bid
  async submitBid(leagueId: string, teamId: string, playerId: string, bidAmount: number) {
    // check budget on team (we store FAAB budget on team.rosterBudget or team.faabBudget)
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new Error("Team not found");
    const budget = (team as any).faabBudget ?? 100; // default 100 if not set
    if (bidAmount > budget) throw new Error("Insufficient FAAB balance");

    const waiver = this.waiverRepo.create({ leagueId, teamId, playerId, bidAmount });
    const saved = await this.waiverRepo.save(waiver);

    // push to Redis list for that league's waivers for batch processing
    await redisClient.rPush(`waivers:league:${leagueId}`, JSON.stringify({ waiverId: saved.id }));
    return saved;
  }

  // immediate view
  async listPending(leagueId: string) {
    return await this.waiverRepo.find({ where: { leagueId, status: "PENDING" } });
  }
}
