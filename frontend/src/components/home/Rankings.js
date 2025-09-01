import React, { useEffect, useState, useMemo } from 'react';
import './css/Rankings.css';

const FORMATS = ['TEST', 'ODI', 'T20I'];

function pickEntry(data, gender, type) {
  return (data || []).find(
    (x) =>
      x.resource === 'rankings' &&
      x.gender?.toLowerCase() === gender.toLowerCase() &&
      x.type?.toUpperCase() === type.toUpperCase()
  );
}

function extractTop5(entry) {
  return (entry?.team || [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      img: t.image_path,
      position: t.ranking?.position,
      rating: t.ranking?.rating,
    }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 5);
}

export default function Rankings() {
  const [data, setData] = useState([]);
  const [gender, setGender] = useState('men');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/team-rankings');
        const json = await res.json();
        setData(Array.isArray(json?.data) ? json.data : json);
      } catch (err) {
        console.error('Failed to fetch team rankings', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const top5Blocks = useMemo(() => {
    return FORMATS.map((format) => {
      const entry = pickEntry(data, gender, format);
      const teams = extractTop5(entry);
      const updatedAt = entry?.updated_at ? new Date(entry.updated_at).toLocaleDateString('en-GB') : null;
      return { format, teams, updatedAt };
    });
  }, [data, gender]);

  return (
    <div className="top5-container">
      <a href="/rankings" className="see-all-btn-floating">All</a>
      <h2 className="rankings-title">ICC Team Rankings</h2>

      <div className="top5-tabs">
        {['men', 'women'].map((g) => (
          <button
            key={g}
            className={`top5-tab ${gender === g ? 'active' : ''}`}
            onClick={() => setGender(g)}
          >
            {g === 'men' ? 'Men' : 'Women'}
          </button>
        ))}
      </div>

      <div className="top5-grid">
        {top5Blocks.map(({ format, teams, updatedAt }) => (
          <div key={format} className="top5-card">
            <div className="top5-card-header">
              <span className="top5-format">{format}</span>
            </div>

            {teams.length > 0 ? (
              <div className="top5-list">
                {teams.map((team) => (
                  <div key={team.id} className="top5-team-row">
                    <div className="top5-rank">{team.position}</div>
                    <div className="top5-team-info">
                      <img src={team.img} alt={team.name} className="top5-flag" />
                      <span className="top5-team-name">{team.name}</span>
                      <span className="top5-team-code">({team.code})</span>
                    </div>
                    <div className="top5-rating">{team.rating}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="top5-no-data">No ranking data available</div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
