import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function WaiversPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(10);
  const teamId = localStorage.getItem("teamId") || "";
  const leagueId = localStorage.getItem("leagueId") || "";

  useEffect(() => {
    api.get("/players?limit=50").then(r => setPlayers(r.data.items || r.data)).catch(()=>{});
  }, []);

  const submitBid = async (playerId: string) => {
    try {
      await api.post("/waivers/bid", { leagueId, teamId, playerId, bidAmount });
      alert("Bid placed");
    } catch (err:any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h2>FAAB Waivers</h2>
      <div>
        <label>Bid amount:<input type="number" value={bidAmount} onChange={e=>setBidAmount(Number(e.target.value))} /></label>
      </div>
      <ul>
        {players.map(p => (
          <li key={p.id}>
            {p.name} <button onClick={() => submitBid(p.id)}>Bid</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
