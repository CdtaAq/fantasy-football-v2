// frontend/src/pages/Leaderboard.tsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function LeaderboardPage() {
  const [board, setBoard] = useState<any[]>([]);
  const leagueId = localStorage.getItem("leagueId") || "";

  useEffect(() => {
    if (!leagueId) return;
    api.get(`/leaderboard/${leagueId}`).then(r => setBoard(r.data)).catch(()=>{});
  }, [leagueId]);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ol>
        {board.map(row => (
          <li key={row.teamId}>
            {row.teamName} — W:{row.wins} L:{row.losses} PF:{row.pointsFor.toFixed(2)} PA:{row.pointsAgainst.toFixed(2)}
          </li>
        ))}
      </ol>
    </div>
  );
}
