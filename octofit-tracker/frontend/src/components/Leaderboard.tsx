import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => { if (active) setLeaderboard(data.leaderboard); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100"><div className="card-body">
      <h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p>
      {error ? <p role="alert">Unable to load leaderboard</p>
        : leaderboard === null ? <p role="status">Loading leaderboard...</p>
        : leaderboard.length === 0 ? <p>No leaderboard rankings</p>
        : <ol className="mb-0">{leaderboard.map((entry) => <li key={entry.teamName}><strong>{entry.teamName}</strong>: {entry.totalPoints}</li>)}</ol>}
    </div></section>
  );
}
