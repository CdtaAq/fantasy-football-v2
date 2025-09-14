// backend/src/api/drafts/draft.order.ts
export function generateSnakeOrder(teamIds: string[], rounds: number) {
  // returns array of teamId order for total picks (rounds * teamCount)
  const order: string[] = [];
  const n = teamIds.length;
  for (let r = 0; r < rounds; r++) {
    if (r % 2 === 0) {
      // normal
      for (let i = 0; i < n; i++) order.push(teamIds[i]);
    } else {
      // reversed
      for (let i = n - 1; i >= 0; i--) order.push(teamIds[i]);
    }
  }
  return order;
}
