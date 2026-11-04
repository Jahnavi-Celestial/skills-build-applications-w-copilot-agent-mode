import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => { if (active) setSuggestions(data.suggestions); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100"><div className="card-body">
      <h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p>
      {error ? <p role="alert">Unable to load workout suggestions</p>
        : suggestions === null ? <p role="status">Loading workout suggestions...</p>
        : suggestions.length === 0 ? <p>No workout suggestions</p>
        : <ul className="list-unstyled mb-0">{suggestions.map((workout, index) => <li key={`${workout.title}-${index}`}><strong>{workout.title}</strong>{workout.reason ? ` - ${workout.reason}` : ''}</li>)}</ul>}
    </div></section>
  );
}
