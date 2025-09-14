import { Router } from "express";
import { requireAuth, authorize } from "../../middleware/auth.middleware";
import { PlayoffService } from "./playoff.service";

const router = Router();
const svc = new PlayoffService();

router.post("/create", requireAuth, authorize("COMMISSIONER"), async (req, res) => {
  try {
    const { leagueId, teamsCount } = req.body;
    const result = await svc.createPlayoffs(leagueId, teamsCount);
    res.json(result);
  } catch (err:any) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/bracket/:leagueId", requireAuth, async (req, res) => {
  try {
    const data = await svc.getPlayoffMatchups(req.params.leagueId);
    res.json(data);
  } catch (err:any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
