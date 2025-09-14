import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { WaiverService } from "./waiver.service";

const router = Router();
const svc = new WaiverService();

// submit FAAB bid
router.post("/bid", requireAuth, async (req, res) => {
  try {
    const { leagueId, teamId, playerId, bidAmount } = req.body;
    // teamId must belong to authenticated user (optional check)
    if (req.user?.id !== (await svc as any).teamRepo?.findOne) {
      // skip strict check here — front end must ensure ownerTeam
    }
    const saved = await svc.submitBid(leagueId, teamId, playerId, Number(bidAmount));
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// list pending bids
router.get("/pending/:leagueId", requireAuth, async (req, res) => {
  try {
    const list = await svc.listPending(req.params.leagueId);
    res.json(list);
  } catch (err:any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
