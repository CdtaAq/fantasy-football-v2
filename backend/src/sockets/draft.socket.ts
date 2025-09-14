import { Server as IOServer, Socket } from "socket.io";
import { DraftService } from "../api/drafts/draft.service";

export function setupDraftSockets(io: IOServer) {
  const draftSvc = new DraftService();

  io.of("/draft").on("connection", (socket: Socket) => {
    console.log("socket connected to /draft", socket.id);

    socket.on("joinDraft", (payload: { draftId: string; userId: string }) => {
      const { draftId } = payload;
      socket.join(draftId);
      // send current draft state (client will GET /drafts/:id/state as well)
      socket.emit("joined", { draftId });
    });

    socket.on("makePick", async (payload: { draftId: string; teamId: string; playerId: string }) => {
      try {
        const pick = await draftSvc.makePick(payload.draftId, payload.teamId, payload.playerId);
        // broadcast pick to room
        io.of("/draft").to(payload.draftId).emit("pick_made", pick);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });
  });
}
