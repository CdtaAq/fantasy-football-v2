// backend/src/api/drafts/draft.service.ts
import { getRepository } from "typeorm";
import { Draft } from "../../db/entity/Draft";
import { Pick } from "../../db/entity/Pick";
import { Team } from "../../db/entity/Team";
import { Player } from "../../db/entity/Player";
import { v4 as uuidv4 } from "uuid";
import Redis from "redis";
import config from "../../config";
import { generateSnakeOrder } from "./draft.order";

const redisClient = Redis.createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
redisClient.connect().catch(console.error);

export class DraftService {
  private draftRepo = getRepository(Draft);
  private pickRepo = getRepository(Pick);
  private teamRepo = getRepository(Team);
  private playerRepo = getRepository(Player);

  // rounds can be computed from roster size; here we pass rounds param for flexibility
  async createDraft(leagueId: string, rounds: number, pickTimeSeconds = 60) {
    // fetch teams and their draftPositions
    const teams = await this.teamRepo.find({ where: { leagueId }, order: { draftPosition: "ASC" } });
    if (teams.length === 0) throw new Error("No teams found for league");
    const teamIds = teams.map((t) => t.id);
    const order = generateSnakeOrder(teamIds, rounds);

    const draft = this.draftRepo.create({
      leagueId,
      status: "waiting",
      pickTimeSeconds,
      picks: [],
    });
    const saved = await this.draftRepo.save(draft);
    // store order in Redis for fast lookup and to track currentPickIndex
    await redisClient.set(`draft:${saved.id}:order`, JSON.stringify(order));
    await redisClient.set(`draft:${saved.id}:index`, "0");
    return saved;
  }

  async startDraft(draftId: string) {
    const draft = await this.draftRepo.findOne({ where: { id: draftId } });
    if (!draft) throw new Error("No draft found");
    draft.status = "ongoing";
    await this.draftRepo.save(draft);
    // ensure redis state exists
    const order = await redisClient.get(`draft:${draftId}:order`);
    if (!order) throw new Error("Draft order missing");
    await redisClient.set(`draft:${draftId}:startedAt`, String(Date.now()));
    return draft;
  }

  private async getCurrentPickIndex(draftId: string) {
    const idxStr = await redisClient.get(`draft:${draftId}:index`);
    return idxStr ? parseInt(idxStr, 10) : 0;
  }

  private async incrementPickIndex(draftId: string) {
    await redisClient.incr(`draft:${draftId}:index`);
  }

  private async getTeamIdForNextPick(draftId: string) {
    const orderRaw = await redisClient.get(`draft:${draftId}:order`);
    if (!orderRaw) throw new Error("Draft order not found");
    const order: string[] = JSON.parse(orderRaw);
    const idx = await this.getCurrentPickIndex(draftId);
    return order[idx] || null;
  }

  // preRankings: map teamId => [playerId,...] (simple JSON stored in Redis)
  async setPreRanking(draftId: string, teamId: string, ranking: string[]) {
    await redisClient.hSet(`draft:${draftId}:preRank`, teamId, JSON.stringify(ranking));
  }

  private async popTopPreRank(draftId: string, teamId: string) {
    const val = await redisClient.hGet(`draft:${draftId}:preRank`, teamId);
    if (!val) return null;
    const arr = JSON.parse(val) as string[];
    let top = arr.shift();
    await redisClient.hSet(`draft:${draftId}:preRank`, teamId, JSON.stringify(arr));
    return top;
  }

  // main pick logic with strict turn enforcement and Redis lock
  async makePick(draftId: string, teamId: string, playerId?: string) {
    const lockKey = `draft:${draftId}:pick-lock`;
    const lock = await redisClient.set(lockKey, teamId, { NX: true, EX: 8 }); // 8s lock
    if (!lock) throw new Error("Another pick is being processed, try again");

    try {
      const draft = await this.draftRepo.findOne({ where: { id: draftId } });
      if (!draft) throw new Error("Draft not found");
      if (draft.status !== "ongoing") throw new Error("Draft is not ongoing");

      const currentTeamId = await this.getTeamIdForNextPick(draftId);
      if (!currentTeamId) throw new Error("Draft completed");

      if (currentTeamId !== teamId) throw new Error("Not your turn");

      // If playerId not provided, try auto-pick from team's pre-ranking, then global top available
      let chosenPlayerId = playerId;
      if (!chosenPlayerId) {
        const top = await this.popTopPreRank(draftId, teamId);
        if (top) chosenPlayerId = top;
        else {
          // fallback: choose lowest id available (simple)
          const pickedPlayerIds = (draft.picks || []).map((p: any) => p.playerId).filter(Boolean);
          const available = await this.playerRepo
            .createQueryBuilder("p")
            .where("p.id NOT IN (:...picked)", { picked: pickedPlayerIds.length ? pickedPlayerIds : [""] })
            .orderBy("p.id", "ASC")
            .limit(1)
            .getOne();
          if (!available) throw new Error("No players available to autobuy");
          chosenPlayerId = available.id;
        }
      }

      // ensure player not taken
      const taken = (draft.picks || []).find((p: any) => p.playerId === chosenPlayerId);
      if (taken) throw new Error("Player already drafted");

      const picksSoFar = await this.pickRepo.find({ where: { draftId }, order: { pickNumber: "DESC" } });
      const nextPickNumber = (picksSoFar[0]?.pickNumber || 0) + 1;
      const pick = this.pickRepo.create({
        id: uuidv4(),
        draftId,
        teamId,
        pickNumber: nextPickNumber,
        playerId: chosenPlayerId,
      });
      await this.pickRepo.save(pick);

      // append to draft.picks and persist
      draft.picks = [...(draft.picks || []), { pickNumber: nextPickNumber, teamId, playerId: chosenPlayerId, timestamp: new Date() }];
      await this.draftRepo.save(draft);

      // increment index
      await this.incrementPickIndex(draftId);

      // If we reach end of order, finish draft
      const orderRaw = await redisClient.get(`draft:${draftId}:order`);
      const order: string[] = orderRaw ? JSON.parse(orderRaw) : [];
      const idx = await this.getCurrentPickIndex(draftId);
      if (idx >= order.length) {
        draft.status = "completed";
        await this.draftRepo.save(draft);
      }

      return pick;
    } finally {
      await redisClient.del(lockKey);
    }
  }

  async getDraftState(draftId: string) {
    const draft = await this.draftRepo.findOne({ where: { id: draftId } });
    const orderRaw = await redisClient.get(`draft:${draftId}:order`);
    const order: string[] = orderRaw ? JSON.parse(orderRaw) : [];
    const idx = await this.getCurrentPickIndex(draftId);
    const nextTeam = order[idx] || null;
    return { draft, nextTeam, pickIndex: idx, orderLength: order.length };
  }
}

