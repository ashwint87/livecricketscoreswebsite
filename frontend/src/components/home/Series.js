import React, { useEffect, useState } from 'react';
import { useSeries } from './../../context/SeriesContext';
import { useNavigate } from 'react-router-dom';
import './css/Series.css';
import dayjs from 'dayjs';

export default function TopSeries() {
  const { allSeries, loading } = useSeries();
  const [seriesList, setSeriesList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const now = dayjs();
    const ongoing = allSeries.filter(s =>
      dayjs(s.start_date).isBefore(now) && dayjs(s.end_date).isAfter(now)
    );
    const upcoming = allSeries.filter(s => dayjs(s.start_date).isAfter(now));

    const topOngoing = ongoing.slice(0, 2);
    const topUpcoming = upcoming.slice(0, 10 - topOngoing.length);

    setSeriesList([...topOngoing, ...topUpcoming]);
  }, [allSeries, loading]);

  function getSeriesLabel(series) {
    const overrideLeagues = ['ICC World Test Championship', 'One Day International', 'Twenty20 International'];
    const validTypes = ['T20', 'T10', 'ODI', 'T20I', '4day', 'Test', 'Test/5day', 'List A'];
    const showType = validTypes.includes(series.series_type) ? ` (${series.series_type})` : '';

    const nameOnlyKeywords = ['Regular', 'Play Offs', 'County', 'Group'];
    const name = nameOnlyKeywords.includes(series.name)
        ? `${series.league}${showType}`
        : `${series.league}`

    const baseName = overrideLeagues.includes(series.league)
      ? `${series.name}${showType}`
      : name
    return `${baseName} ${series.season}`;
  }

  return (
    <div className="key-series-section">
      <a href="/series" className="see-all-btn-floating">All</a>
      <h2 className="key-series-title">Featured Series</h2>

      <div className="series-pill-container">
        {seriesList.map((series, idx) => (
          <div
            key={series.id}
            className={`series-pill ${idx === 0 ? 'active' : ''}`}
            onClick={() =>
              navigate(`/series/${series.id}/${series.season_id}`, {
                state: {
                  seriesLabel: getSeriesLabel(series),
                  seriesCode: series.code,
                },
              })
            }
          >
            {getSeriesLabel(series)}
          </div> 
        ))}
      </div>
    </div>
  );
}
