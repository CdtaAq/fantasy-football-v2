/**
 * Consumes stat_events from Redis list and apply to Player.stats
 * Each event: { playerId, statType, value, eventId }
 * Use Redis SETNX on eventId to ensure idempotency.
 */
import Redis from "redis";
import { getRepository } from "typeorm";
import config from "../config";
import { Player } from "../db/entity/Player";

const redisClient = Redis.createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
redisClient.connect().catch(console.error);

export async function consumeStatEventsOnce() {
  const key = "stat_events";
  // use BRPOP with timeout 1 sec in loop or LPOP in batch; here process all available
  while (true) {
    const raw = await redisClient.lPop(key);
    if (!raw) break;
    try {
      const ev = JSON.parse(raw);
      const idempotentKey = ev.eventId ? `stat_event_processed:${ev.eventId}` : null;
      if (idempotentKey) {
        const ok = await redisClient.set(idempotentKey, "1", { NX: true, EX: 60 * 60 * 24 }); // keep for a day
        if (!ok) {
          continue; // already processed
        }
      }
      // apply to player stats
      const playerRepo = getRepository(Player);
      const player = await playerRepo.findOne({ where: { id: ev.playerId } });
      if (!player) continue;
      const stats = { ...(player.stats || {}) };
      // aggregate by statType name; e.g., passingYds, rushingTd
      stats[ev.statType] = (stats[ev.statType] || 0) + Number(ev.value || 0);
      player.stats = stats;
      await playerRepo.save(player);
    } catch (err) {
      console.error("stat event error", err);
    }
  }
}
