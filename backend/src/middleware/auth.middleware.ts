import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export interface AuthRequest extends Request {
  user?: { id: string; email?: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
