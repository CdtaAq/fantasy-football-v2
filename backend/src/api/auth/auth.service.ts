import { getRepository } from "typeorm";
import { User } from "../../db/entity/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";

export class AuthService {
  private userRepo = getRepository(User);

  async register(email: string, password: string, displayName?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error("Email already in use");
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash: hash, displayName });
    await this.userRepo.save(user);
    return this.signToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");
    return this.signToken(user);
  }

  private signToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
    return { token, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }
}
