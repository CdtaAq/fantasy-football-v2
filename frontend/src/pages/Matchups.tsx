// frontend/src/pages/Matchups.tsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function MatchupsPage() {
  const [matchups, setMatchups] = useState<any[]>([]);
  const [week, setWeek] = useState<number>(1);
  const leagueId = localStorage.getItem("leagueId") || "";

  useEffect(() => {
    if (!leagueId) return;
    api.get(`/matchups?leagueId=${leagueId}&week=${week}`).then(r => setMatchups(r.data)).catch(()=>{});
  }, [leagueId, week]);

  return (
    <div>
      <h2>Week {week} Matchups</h2>
      <div>
        {matchups.map(m => (
          <div key={m.id} style={{border:"1px solid #ddd", padding:8, margin:6}}>
            <div>Home: {m.teamHomeId} — Away: {m.teamAwayId}</div>
            <div>Score: {m.scoreHome} - {m.scoreAway} {m.completed ? "(Completed)" : "(Pending)"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
