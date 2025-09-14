import "reflect-metadata";
import express from "express";
import cors from "cors";
import { createConnection } from "typeorm";
import config from "./config";
import authRoutes from "./api/auth/auth.controller";
import draftRoutes from "./api/drafts/draft.routes";
import http from "http";
import { Server as IOServer } from "socket.io";
import { setupDraftSockets } from "./sockets/draft.socket";
import expressAsyncErrors from "express-async-errors";

async function bootstrap() {
  await createConnection({
    type: "postgres",
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [__dirname + "/db/entity/*{.ts,.js}"],
    synchronize: true // dev only — use migrations in prod
  });

  const app = express();
  app.use(cors({ origin: config.frontendUrl }));
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/drafts", draftRoutes);

  app.get("/health", (req, res) => res.json({ ok: true }));

  const server = http.createServer(app);
  const io = new IOServer(server, { cors: { origin: config.frontendUrl } });
  setupDraftSockets(io);

  server.listen(config.port, () => {
    console.log(`Backend listening on ${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
