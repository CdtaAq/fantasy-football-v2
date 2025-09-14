// frontend/src/pages/DraftRoom.tsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useParams } from "react-router-dom";

export default function DraftRoom() {
  const { id } = useParams(); // draft id
  const [state, setState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const teamId = localStorage.getItem("teamId") || "";

  useEffect(() => {
    if (!id) return;
    api.get(`/drafts/${id}/state`).then(r => setState(r.data)).catch(()=>{});
    api.get("/players?limit=50").then(r => setPlayers(r.data)).catch(()=>{});
    const s = io((import.meta.env.VITE_API_BASE || "http://localhost:5000").replace("/api", ""));
    const nsp = s.of("/draft");
    nsp.on("connect", ()=>console.log("connected to draft socket"));
    nsp.on("pick_made", (p:any) => {
      // refresh state to get updated nextTeam
      api.get(`/drafts/${id}/state`).then(r => setState(r.data)).catch(()=>{});
    });
    setSocket(nsp);
    return () => s.disconnect();
  }, [id]);

  const makePick = async (playerId: string) => {
    try {
      await api.post(`/drafts/${id}/picks`, { teamId, playerId });
      // server will broadcast; state will refresh from socket handler
    } catch (err:any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h2>Draft Room</h2>
      {state && (
        <div>
          <div>Next team to pick: {state.nextTeam}</div>
          <div>Pick index: {state.pickIndex}/{state.orderLength}</div>
        </div>
      )}
      <div style={{display:'flex', gap:12}}>
        <div style={{flex:1}}>
          <h3>Picks</h3>
          <ol>
            {state?.draft?.picks?.map((p:any, idx:number) => <li key={idx}>#{p.pickNumber} — {p.playerId} (team {p.teamId})</li>)}
          </ol>
        </div>
        <div style={{flex:1}}>
          <h3>Players</h3>
          <ul>
            {players.map(pl => (
              <li key={pl.id}>
                {pl.name} <button onClick={() => makePick(pl.id)}>Pick</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
