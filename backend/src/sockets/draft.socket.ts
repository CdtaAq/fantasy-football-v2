import { Server as IOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config";
import { getRepository } from "typeorm";
import { Team } from "../db/entity/Team";
import { DraftService } from "../api/drafts/draft.service";

/**
 * Socket handshake: client must connect with token: io(url, { auth: { token } })
 * or as query param ?token=<jwt>
 */
export function setupDraftSockets(io: IOServer) {
  const draftSvc = new DraftService();

  io.of("/draft").use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Auth token missing"));
      const payload = jwt.verify(String(token), config.jwtSecret) as any;
      (socket as any).user = payload; // store payload on socket
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.of("/draft").on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    console.log("socket connected (auth):", socket.id, "user:", user?.sub);

    socket.on("joinDraft", (payload: { draftId: string }) => {
      socket.join(payload.draftId);
      socket.emit("joined", { draftId: payload.draftId });
    });

    socket.on("makePick", async (payload: { draftId: string; teamId: string; playerId?: string }) => {
      try {
        // ensure socket user owns the team
        const teamRepo = getRepository(Team);
        const team = await teamRepo.findOne({ where: { id: payload.teamId } });
        if (!team) return socket.emit("error", { message: "Team not found" });

        if (team.ownerUserId !== user.sub) {
          return socket.emit("error", { message: "You do not own this team" });
        }

        // ensure it's this team's turn
        const state = await draftSvc.getDraftState(payload.draftId);
        if (state.nextTeam !== payload.teamId) {
          return socket.emit("error", { message: "Not your turn" });
        }

        const pick = await draftSvc.makePick(payload.draftId, payload.teamId, payload.playerId);
        io.of("/draft").to(payload.draftId).emit("pick_made", pick);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });
  });
}
