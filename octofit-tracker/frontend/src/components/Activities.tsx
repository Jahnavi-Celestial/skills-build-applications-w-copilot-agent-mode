import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type: string;
  minutes: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setActivities(data.activities);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load activities');
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {error ? (
          <p role="alert">Unable to load activities</p>
        ) : activities === null ? (
          <p role="status">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`}>
                {activity.type}: {activity.minutes} minutes{activity.points ? `, ${activity.points} points` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
