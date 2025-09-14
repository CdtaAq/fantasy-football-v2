import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { DraftService } from "./draft.service";
const router = Router();
const svc = new DraftService();

router.post("/", requireAuth, async (req, res) => {
  const { leagueId } = req.body;
  const draft = await svc.createDraft(leagueId);
  res.json(draft);
});

router.post("/:id/start", requireAuth, async (req, res) => {
  const { id } = req.params;
  const draft = await svc.startDraft(id);
  res.json(draft);
});

router.post("/:id/picks", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { teamId, playerId } = req.body;
  try {
    const pick = await svc.makePick(id, teamId, playerId);
    res.json(pick);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
