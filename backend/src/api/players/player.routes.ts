import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import multer from "multer";
import csvParser from "csv-parse";
import fs from "fs";
import { getRepository } from "typeorm";
import { Player } from "../../db/entity/Player";
import Redis from "redis";
import config from "../../config";

const router = Router();
const upload = multer({ dest: "/tmp" });
const redisClient = Redis.createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
redisClient.connect().catch(console.error);

// GET /players?q=&page=&limit=
router.get("/", async (req, res) => {
  const q = String(req.query.q || "");
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const repo = getRepository(Player);
  const qb = repo.createQueryBuilder("p");
  if (q) {
    qb.where("p.name ILIKE :q OR p.position ILIKE :q OR p.nflTeam ILIKE :q", { q: `%${q}%` });
  }
  qb.skip((page - 1) * limit).take(limit).orderBy("p.name", "ASC");
  const [items, total] = await qb.getManyAndCount();
  res.json({ items, total, page, limit });
});

// CSV upload to create players or ingest from provider
router.post("/upload-csv", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const path = (req.file && req.file.path) || "";
    if (!path) return res.status(400).json({ message: "File required" });

    const content = fs.readFileSync(path, "utf8");
    csvParser(content, { columns: true, trim: true }, async (err, records) => {
      if (err) return res.status(400).json({ message: err.message });
      const repo = getRepository(Player);
      const created: any[] = [];
      for (const r of records) {
        const p = repo.create({ name: r.name || r.Name, position: r.position || r.Position, nflTeam: r.team || r.Team, stats: {} });
        await repo.save(p);
        created.push(p);
      }
      // delete temp file
      fs.unlinkSync(path);
      res.json({ createdCount: created.length, created });
    });
  } catch (err:any) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to receive mock stat event (can be called by ingestion script or provider webhook)
// POST /players/stat-event { playerId, statType, value, eventId (optional idempotency) }
router.post("/stat-event", async (req, res) => {
  try {
    const { playerId, statType, value, eventId } = req.body;
    if (!playerId || !statType) return res.status(400).json({ message: "playerId and statType required" });
    // push event to Redis list for scoring worker to consume
    await redisClient.rPush("stat_events", JSON.stringify({ playerId, statType, value, eventId }));
    res.json({ ok: true });
  } catch (err:any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
