import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => { if (active) setTeams(data.teams); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100"><div className="card-body">
      <h2 className="h4">Teams</h2><p>Manage teams and members.</p>
      {error ? <p role="alert">Unable to load teams</p>
        : teams === null ? <p role="status">Loading teams...</p>
        : teams.length === 0 ? <p>No teams</p>
        : <ul className="list-unstyled mb-0">{teams.map((team, index) => <li key={`${team.name}-${index}`}><strong>{team.name}</strong>{team.mascot ? ` - ${team.mascot}` : ''}</li>)}</ul>}
    </div></section>
  );
}
