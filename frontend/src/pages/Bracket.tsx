import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function BracketPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const leagueId = localStorage.getItem("leagueId") || "";

  useEffect(() => {
    if (!leagueId) return;
    api.get(`/playoffs/bracket/${leagueId}`).then(r => setMatches(r.data)).catch(()=>{});
  }, [leagueId]);

  return (
    <div>
      <h2>Playoff Bracket</h2>
      <div>
        {matches.map(m => (
          <div key={m.id} style={{border:"1px solid #ccc", padding:8, margin:8}}>
            <div>{m.teamHomeId} vs {m.teamAwayId}</div>
            <div>Score: {m.scoreHome} - {m.scoreAway} {m.completed ? "(played)" : "(upcoming)"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
