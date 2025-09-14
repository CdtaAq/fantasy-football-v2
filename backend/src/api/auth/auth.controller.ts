import { Router } from "express";
import { AuthService } from "./auth.service";

const router = Router();
const svc = new AuthService();

router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const result = await svc.register(email, password, displayName);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await svc.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
