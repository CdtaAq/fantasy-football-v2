// backend/src/api/matchups/matchup.routes.ts
import { Router } from "express";
import { requireAuth, authorize } from "../../middleware/auth.middleware";
import { MatchupService } from "./matchup.service";

const router = Router();
const svc = new MatchupService();

router.post("/", requireAuth, authorize("COMMISSIONER"), async (req, res) => {
  try {
    const { leagueId, week } = req.body;
    const created = await svc.generateWeek(leagueId, week);
    res.json(created);
  } catch (err:any) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { leagueId, week } = req.query;
    const data = await svc.getMatchups(String(leagueId), Number(week));
    res.json(data);
  } catch (err:any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
