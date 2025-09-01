// src/components/Series.js
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeriesRanges } from './../context/SeriesRangesContext';
import './css/Series.css';

// helpers
const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const fullDate = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return `${ordinal(dt.getDate())} ${dt.toLocaleString('en-GB', { month: 'long' })} ${dt.getFullYear()}`;
};
const monthKey = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Unknown';

// your naming with Tri/Test override
function seriesName(base) {
  const league = String(base?.league || '');
  const validTypes = ['T20', 'T10', 'ODI', 'T20I', '4day', 'Test', 'Test/5day', 'List A'];
  const showType = validTypes.includes(base?.series_type) ? `(${base.series_type})` : '';

  // If league mentions "Tri" or "Test": show base.name (with type) and season
  if (/\b(tri|test)(?:\b|-)/i.test(league)) {
    return `${base?.name || ''} ${showType ? `${showType} ` : ''}${base?.season || ''}`.trim();
  }

  const overrideLeagues = ['ICC World Test Championship', 'One Day International', 'Twenty20 International'];

  const nameOnlyKeywords = ['Regular', 'Play Offs', 'County', 'Group'];
  const name = nameOnlyKeywords.includes(base?.name) ? `${base?.league || ''}` : `${base?.league || ''}`;

  const baseName = overrideLeagues.includes(base?.league)
    ? `${base?.name || ''} ${showType}`.trim()
    : `${name} ${showType}`.trim();

  return `${baseName} ${base?.season || ''}`.trim();
}

export default function Series() {
  const { seriesRows, loadingSeriesRows } = useSeriesRanges();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return seriesRows;
    return seriesRows.filter(({ base }) =>
      (base.name || '').toLowerCase().includes(q) ||
      (base.league || '').toLowerCase().includes(q)
    );
  }, [seriesRows, search]);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of filtered) {
      const key = monthKey(r.startDate);
      const arr = m.get(key) || [];
      arr.push(r);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  if (loadingSeriesRows) {
    return (
      <div className="series-container">
        <h1>Cricket Series</h1>

<div className="series-searchbar">
  <svg
    className="search-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M21 21l-4.35-4.35m1.1-4.4a7.75 7.75 0 11-15.5 0 7.75 7.75 0 0115.5 0z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <input
    type="text"
    placeholder="Search series..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Escape') setSearch('');
    }}
    className="series-search series-search-input"
  />

  {search && (
    <button
      type="button"
      className="clear-btn"
      aria-label="Clear search"
      onClick={() => setSearch('')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M18 6L6 18M6 6l12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )}
</div>

        <div>Loading…</div>
      </div>
    );
  }

  return (
    <div className="series-container">
      <h1>Cricket Series</h1>

<div className="series-searchbar">
  <svg
    className="search-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M21 21l-4.35-4.35m1.1-4.4a7.75 7.75 0 11-15.5 0 7.75 7.75 0 0115.5 0z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <input
    type="text"
    placeholder="Search series..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Escape') setSearch('');
    }}
    className="series-search series-search-input"
  />

  {search && (
    <button
      type="button"
      className="clear-btn"
      aria-label="Clear search"
      onClick={() => setSearch('')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M18 6L6 18M6 6l12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )}
</div>



      <div className="series-table">
        <div className="series-table-row series-table-head">
          <div className="series-col-month">Month</div>
          <div className="series-col-name">Series Name</div>
        </div>

        {grouped.map(([monthLabel, items]) => (
          <React.Fragment key={monthLabel}>
            {items.map((r, idx) => {
              const title = seriesName(r.base);
              const startText = r.startDate ? fullDate(r.startDate) : '—';
              const endText = r.endDate ? fullDate(r.endDate) : '—';

              return (
                <div className="series-table-row" key={`${r.firstStageId}-${idx}`}>
                  <div className="series-col-month">{idx === 0 ? monthLabel : ''}</div>

                  <div className="series-col-name">
                    <Link
                      to={`/series/${r.firstStageId}/${r.season_id}`}
                      state={{
                        seriesLabel: title,
                        seriesCode: r.code,
                        stageIds: r.stage_ids,
                      }}
                      className="series-row-link"
                    >
                      <div className="series-row-title">{title}</div>

                      <div className="series-row-dates">
                        Start Date: {startText}
                      </div>
                      <div className="series-row-dates">
                        End Date: {endText}
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
