import React, { useEffect, useMemo, useState } from 'react';
import './css/Rankings.css';

const FORMATS = ['TEST', 'ODI', 'T20I'];
const GENDERS = ['men', 'women'];

function pickEntry(data, gender, type) {
  if (!Array.isArray(data)) return null;
  return data.find(
    (x) =>
      String(x?.resource).toLowerCase() === 'rankings' &&
      String(x?.gender).toLowerCase() === String(gender).toLowerCase() &&
      String(x?.type).toUpperCase() === String(type).toUpperCase()
  );
}

function normaliseTeams(entry) {
  // Return array of {id, name, code, img, position, matches, points, rating}
  const teams = entry?.team || [];
  return teams
    .map((t) => ({
      id: t?.id ?? t?.team_id ?? Math.random(),
      name: t?.name || '',
      code: t?.code || '',
      img: t?.image_path || '',
      position: t?.ranking?.position ?? t?.position ?? null,
      matches: t?.ranking?.matches ?? null,
      points: t?.ranking?.points ?? null,
      rating: t?.ranking?.rating ?? null,
    }))
    .filter((t) => t.name && t.position != null)
    .sort((a, b) => a.position - b.position);
}

function TopBanner({ format, team }) {
  if (!team) return null;
  return (
    <div className="rk-banner">
      <div className="rk-banner-media">
        {team.img ? <img src={team.img} alt={team.name} /> : <div className="rk-fallback" />}
        <span className="rk-format-chip">{format}</span>
      </div>
      <div className="rk-banner-body">
        <div className="rk-banner-title">
          <span className="rk-no1">No. 1</span> {team.name}
        </div>
        <div className="rk-banner-sub">
          Rating <strong>{team.rating ?? '-'}</strong> • Matches <strong>{team.matches ?? '-'}</strong> • Points <strong>{team.points ?? '-'}</strong>
        </div>
      </div>
    </div>
  );
}

function RankTable({ teams }) {
  if (!teams?.length) return null;
  return (
    <div className="rk-table">
      <div className="rk-thead">
        <div>#</div>
        <div>Team</div>
        <div className="rk-right">Mat</div>
        <div className="rk-right">Pts</div>
        <div className="rk-right">Rating</div>
      </div>
      <div className="rk-tbody">
        {teams.map((t) => (
          <div key={`${t.id}-${t.position}`} className="rk-row">
            <div className="rk-pos">{t.position}</div>
            <div className="rk-teamcell">
              {t.img ? <img className="rk-crest" src={t.img} alt={t.name} /> : <div className="rk-crest rk-crest--placeholder" />}
              <span className="rk-teamname">{t.name}</span>
              {t.code ? <span className="rk-teamcode">({t.code})</span> : null}
            </div>
            <div className="rk-right">{t.matches ?? '-'}</div>
            <div className="rk-right">{t.points ?? '-'}</div>
            <div className="rk-right">{t.rating ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Rankings() {
  const [data, setData] = useState([]);
  const [gender, setGender] = useState('men');   // men | women
  const [format, setFormat] = useState('TEST');  // TEST | ODI | T20I
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const resp = await fetch('/api/team-rankings');
        const json = await resp.json();
        if (mounted) {
          setData(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
        }
      } catch (e) {
        if (mounted) setErr(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentEntry = useMemo(() => pickEntry(data, gender, format), [data, gender, format]);
  const teams = useMemo(() => normaliseTeams(currentEntry), [currentEntry]);

  // Split top-1 vs rest
  const topTeam = teams?.[0] || null;
  const rest = teams?.slice(1) || [];

  const updatedAt = currentEntry?.updated_at ? new Date(currentEntry.updated_at) : null;

  return (
    <div className="rk-wrap">
      <div className="rk-head">
        <div className="rk-tabs">
          {GENDERS.map((g) => (
            <button
              key={g}
              className={`rk-tab ${gender === g ? 'is-active' : ''}`}
              onClick={() => setGender(g)}
            >
              {g === 'men' ? 'Men' : 'Women'}
            </button>
          ))}
        </div>

        <div className="rk-tabs rk-tabs--formats">
          {FORMATS.map((f) => (
            <button
              key={f}
              className={`rk-tab ${format === f ? 'is-active' : ''}`}
              onClick={() => setFormat(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="rk-state">Loading team rankings…</div>}
      {!loading && err && <div className="rk-state rk-error">Failed to load: {err}</div>}

      {!loading && !err && (!teams || teams.length === 0) && (
        <div className="rk-state">
          No rankings found for <strong>{gender}</strong> • <strong>{format}</strong>.
        </div>
      )}

      {!loading && !err && teams && teams.length > 0 && (
        <>
          <TopBanner format={format} team={topTeam} />

          <div className="rk-section-title">Standings</div>
          <RankTable teams={rest} />
        </>
      )}
    </div>
  );
}
