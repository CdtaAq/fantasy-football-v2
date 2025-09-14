/**
 * Waiver batch resolution worker (FAAB)
 * - runs periodically (e.g., after games or when commissioner triggers)
 * - for each league, read Redis list 'waivers:league:<leagueId>' -> process all pending bids
 * - resolves bids by highest bid; in case of tie, lower waiver priority (not implemented) or random/timestamp
 * - deduct FAAB credits from winning team
 */
import Redis from "redis";
import { getRepository } from "typeorm";
import config from "../config";
import { Waiver } from "../db/entity/Waiver";
import { Team } from "../db/entity/Team";
import { Player } from "../db/entity/Player";

const redisClient = Redis.createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
redisClient.connect().catch(console.error);

export async function processWaiversForLeague(leagueId: string) {
  const waiverRepo = getRepository(Waiver);
  const teamRepo = getRepository(Team);
  const playerRepo = getRepository(Player);

  // pop all waiver items for league from Redis queue
  const key = `waivers:league:${leagueId}`;
  // LRANGE then DEL to get snapshot in dev; in production use atomic list drain patterns
  const items = [];
  const len = await redisClient.lLen(key);
  for (let i = 0; i < len; i++) {
    const v = await redisClient.lPop(key);
    if (v) items.push(JSON.parse(v));
  }
  if (items.length === 0) return;

  // fetch waiver records
  const waiverIds = items.map((it: any) => it.waiverId);
  const waivers = await waiverRepo.findByIds(waiverIds);

  // group by playerId
  const byPlayer = new Map<string, Waiver[]>();
  for (const w of waivers) {
    if (w.status !== "PENDING") continue;
    const arr = byPlayer.get(w.playerId) || [];
    arr.push(w);
    byPlayer.set(w.playerId, arr);
  }

  for (const [playerId, bids] of byPlayer.entries()) {
    // sort bids: highest bidAmount first, tie-break by earlier createdAt
    bids.sort((a, b) => {
      if (b.bidAmount !== a.bidAmount) return b.bidAmount - a.bidAmount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const winner = bids[0];
    // confirm player still available (not rostered)
    const teams = await teamRepo.find({ where: { leagueId } });
    const taken = teams.some(t => (t.roster || []).includes(playerId));
    if (taken) {
      // mark all as rejected
      for (const b of bids) {
        b.status = "REJECTED";
        await waiverRepo.save(b);
      }
      continue;
    }

    // award to winner: assign to team roster and deduct FAAB
    const winningTeam = await teamRepo.findOne({ where: { id: winner.teamId } });
    if (!winningTeam) {
      // mark all rejected
      for (const b of bids) { b.status = "REJECTED"; await waiverRepo.save(b); }
      continue;
    }

    winningTeam.roster = [...(winningTeam.roster || []), playerId];
    // track faabBudget (default 100)
    (winningTeam as any).faabBudget = ((winningTeam as any).faabBudget ?? 100) - winner.bidAmount;
    await teamRepo.save(winningTeam);

    winner.status = "AWARDED";
    await waiverRepo.save(winner);

    // losers
    for (const b of bids.slice(1)) { b.status = "REJECTED"; await waiverRepo.save(b); }
  }
}

export async function waiverWorkerTick() {
  // get list of leagues with pending waiver lists; for demo we can scan known leagues using DB
  // Simpler: read all keys matching waivers:league:*
  try {
    const keys = await redisClient.keys("waivers:league:*");
    for (const key of keys) {
      const leagueId = key.split(":")[2];
      await processWaiversForLeague(leagueId);
    }
  } catch (err) {
    console.error("waiver worker error", err);
  }
}

// If you want to start periodically, import and setInterval in index.ts
