import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import api from "../services/api";

type Pick = {
  id: string;
  draftId: string;
  teamId: string;
  pickNumber: number;
  playerId?: string;
};

export default function DraftRoom({ draftId }: { draftId: string }) {
  const socket = useSocket("/draft");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [teamId] = useState<string>(() => localStorage.getItem("teamId") || "");

  useEffect(() => {
    // fetch initial draft state
    (async () => {
      const res = await api.get(`/drafts/${draftId}`);
      setPicks(res.data.picks || []);
    })();
  }, [draftId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("joinDraft", { draftId, userId: "me" });

    socket.on("pick_made", (pick: Pick) => {
      setPicks((p) => [...p, pick]);
    });

    socket.on("error", (err: any) => {
      console.error("socket error", err);
    });

    return () => {
      socket.off("pick_made");
      socket.off("error");
    };
  }, [socket, draftId]);

  const makePick = async (playerId: string) => {
    if (!socket) return;
    socket.emit("makePick", { draftId, teamId, playerId });
    // optimistic UI: wait for confirmation via socket
  };

  return (
    <div>
      <h2>Draft Room</h2>
      <div>
        <h3>Picks</h3>
        <ol>
          {picks.map((p) => (
            <li key={p.id}>
              #{p.pickNumber} - {p.teamId} → {p.playerId || "TBD"}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3>Available Players (demo)</h3>
        <ul>
          {availablePlayers.slice(0, 10).map((pl) => (
            <li key={pl.id}>
              {pl.name} <button onClick={() => makePick(pl.id)}>Pick</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
