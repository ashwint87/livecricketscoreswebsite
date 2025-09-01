import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import NewsWrapper from './NewsWrapper';
import YouTubeVideoList from "./YouTubeVideoList";
import './css/PlayerDetails.css';

export default function PlayerDetails() {
  const { id } = useParams();
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Wikipedia states
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiExtract, setWikiExtract] = useState('');
  const [wikiThumb, setWikiThumb] = useState('');
  const [wikiPageUrl, setWikiPageUrl] = useState('');
  const [wikiError, setWikiError] = useState('');

  // ---------- data fetch (player) ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/player/${id}`);
        const data = await res.json();
        if (mounted) setPlayerInfo(data?.data?.data || null);
      } catch (err) {
        console.error('Error fetching player:', err);
        if (mounted) setPlayerInfo(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // ---------- helpers (pure functions) ----------
  const normalizeFormat = (t = '') => (t.toLowerCase().startsWith('test') ? 'Test' : t);
  const seasonKey = (name = '') => {
    const m = String(name).match(/(\d{4})(?:\s*\/\s*(\d{4}))?/);
    if (!m) return -Infinity;
    return m[2] ? Number(m[2]) : Number(m[1]);
  };

  const safeNum = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
  const to2 = (v) => (v == null || Number.isNaN(+v) ? '—' : Number(v).toFixed(2));
  const showIfNum = (v) => (v == null || Number.isNaN(+v) ? '—' : String(v));
  const bowlingAvg = (avg, w) => (safeNum(w) > 0 ? to2(avg) : '—');
  const bowlingSR  = (sr,  w) => (safeNum(w) > 0 ? to2(sr)  : '—');

  const sumInto = (dst, src) => {
    dst.matches = safeNum(dst.matches) + safeNum(src.matches);
    dst.innings = safeNum(dst.innings) + safeNum(src.innings);
    dst.runs    = safeNum(dst.runs)    + safeNum(src.runs);
    dst.notOuts = safeNum(dst.notOuts) + safeNum(src.notOuts);
    dst.high    = Math.max(safeNum(dst.high), safeNum(src.high));
    return dst;
  };

  const sumBowlInto = (dst, src) => {
    dst.matches = safeNum(dst.matches) + safeNum(src.matches);
    dst.innings = safeNum(dst.innings) + safeNum(src.innings);
    dst.wickets = safeNum(dst.wickets) + safeNum(src.wickets);
    dst.five    = safeNum(dst.five)    + safeNum(src.five);
    dst.ten     = safeNum(dst.ten)     + safeNum(src.ten);
    dst._merged = true;
    return dst;
  };

  // ---------- prepare grouped & deduped tables (HOOK) ----------
  const { groupedBatting, groupedBowling, orderedFormats } = useMemo(() => {
    const career = playerInfo?.career || [];
    const batMap = new Map();  // key: `${type}::${seasonName}`
    const bowlMap = new Map();

    career.forEach((c) => {
      const type = normalizeFormat(c?.type || '');
      const seasonName = c?.season?.name || '';
      const key = `${type}::${seasonName}`;

      if (c?.batting) {
        const row = {
          type, seasonName,
          matches: c.batting.matches,
          innings: c.batting.innings,
          runs: c.batting.runs_scored,
          notOuts: c.batting.not_outs,
          high: c.batting.highest_inning_score,
          avg: c.batting.average,
          sr:  c.batting.strike_rate,
        };
        if (batMap.has(key)) {
          const merged = sumInto(batMap.get(key), row);
          merged.avg = '—';
          merged.sr  = '—';
          batMap.set(key, merged);
        } else {
          batMap.set(key, row);
        }
      }

      if (c?.bowling) {
        const row = {
          type, seasonName,
          matches: c.bowling.matches,
          innings: c.bowling.innings,
          wickets: c.bowling.wickets,
          avg:     c.bowling.average,
          econ:    c.bowling.econ_rate,
          sr:      c.bowling.strike_rate,
          five:    c.bowling.five_wickets,
          ten:     c.bowling.ten_wickets,
        };
        if (bowlMap.has(key)) {
          const merged = sumBowlInto(bowlMap.get(key), row);
          merged.avg  = '—';
          merged.econ = '—';
          merged.sr   = '—';
          bowlMap.set(key, merged);
        } else {
          bowlMap.set(key, row);
        }
      }
    });

    const groupByType = (rows) => {
      const out = new Map(); // type -> rows[]
      rows.forEach((r) => {
        const arr = out.get(r.type) || [];
        arr.push(r);
        out.set(r.type, arr);
      });
      out.forEach((arr) => arr.sort((a, b) => seasonKey(b.seasonName) - seasonKey(a.seasonName)));
      return out;
    };

    const groupedBatting = groupByType([...batMap.values()]);
    const groupedBowling = groupByType([...bowlMap.values()]);

    const preferred = ['Test', 'ODI', 'T20I', 'T20'];
    const seen = new Set([...groupedBatting.keys(), ...groupedBowling.keys()]);
    const orderedFormats = [
      ...preferred.filter((f) => seen.has(f)),
      ...[...seen].filter((f) => !preferred.includes(f)),
    ];

    return { groupedBatting, groupedBowling, orderedFormats };
  }, [playerInfo]);

async function getWikipediaExtractSmart(playerFullName) {
  // Step 1: Try direct title (with underscores)
  const wikiTitle = playerFullName.trim().replace(/\s+/g, '_');
  const directUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    wikiTitle
  )}&prop=extracts|pageimages&exintro=true&format=json&origin=*`;

  const directRes = await fetch(directUrl);
  const directJson = await directRes.json();
  const directPage = Object.values(directJson?.query?.pages || {})[0] || {};
  const directExtract = directPage?.extract || '';
  const directThumb = directPage?.thumbnail?.source || '';
  const directTitle = directPage?.title || wikiTitle;

  // ✅ Return if extract is valid
  if (directExtract?.trim()) {
    return {
      extract: directExtract,
      thumb: directThumb,
      title: directTitle,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(directTitle.replace(/\s+/g, '_'))}`
    };
  }

  // Step 2: Fallback to search if extract is empty
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    playerFullName + ' cricketer'
  )}&format=json&origin=*`;

  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json();
  const bestTitle = searchJson?.query?.search?.[0]?.title;

  if (!bestTitle) {
    return { extract: '', thumb: '', title: '', url: '' };
  }

  // Step 3: Try extract again using canonical title
  const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    bestTitle
  )}&prop=extracts|pageimages&exintro=true&format=json&origin=*`;

  const fallbackRes = await fetch(fallbackUrl);
  const fallbackJson = await fallbackRes.json();
  const fallbackPage = Object.values(fallbackJson?.query?.pages || {})[0] || {};

  return {
    extract: fallbackPage?.extract || '',
    thumb: fallbackPage?.thumbnail?.source || '',
    title: fallbackPage?.title || bestTitle,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
      (fallbackPage?.title || bestTitle).replace(/\s+/g, '_')
    )}`
  };
}

useEffect(() => {
  if (!playerInfo?.fullname) return;

  setWikiLoading(true);
  setWikiError('');

  (async () => {
    const { extract, thumb, title, url } = await getWikipediaExtractSmart(playerInfo.fullname);

    if (extract) {
      setWikiExtract(extract);
      setWikiThumb(thumb);
      setWikiPageUrl(url);
    } else {
      setWikiExtract('');
      setWikiThumb('');
      setWikiPageUrl('');
      setWikiError('Wikipedia profile not found.');
    }

    setWikiLoading(false);
  })();
}, [playerInfo]);

function formatCricketStyle(style) {
  if (!style) return '—';
  return style
    .replace(/-/g, ' ')                 // replace hyphens with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize first letter of each word
    .replace(/\bBat\b/, 'bat')          // lowercase 'bat' (cosmetically correct)
    .replace(/\bArm\b/, 'arm');         // lowercase 'arm'
}

  // ---------- early returns AFTER hooks ----------
  if (loading) return <div className="player-details">Loading...</div>;
  if (!playerInfo) return <div className="player-details">No player data.</div>;

  const {
    fullname,
    image_path,
    country,
    battingstyle,
    bowlingstyle,
    dateofbirth,
    position,
  } = playerInfo;

  const playerFullName = `${fullname}`;

  return (
    <div className="player-details">
      <div className="player-header">
        {image_path && <img src={image_path} alt={fullname} />}
        <div>
          <h2>{fullname}</h2>
          <p><strong>Country:</strong> {country?.name || '—'}</p>
          {position?.name && <p><strong>Position:</strong> {position.name}</p>}
          {battingstyle && <p><strong>Batting Style:</strong> {formatCricketStyle(battingstyle)}</p>}
          {bowlingstyle && <p><strong>Bowling Style:</strong> {formatCricketStyle(bowlingstyle)}</p>}
          {dateofbirth && <p><strong>Date of Birth:</strong> {dateofbirth}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="stat-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'batting' ? 'active' : ''}
          onClick={() => setActiveTab('batting')}
        >
          Batting Stats
        </button>
        <button
          className={activeTab === 'bowling' ? 'active' : ''}
          onClick={() => setActiveTab('bowling')}
        >
          Bowling Stats
        </button>
        <button
          className={activeTab === 'news' ? 'active' : ''}
          onClick={() => setActiveTab('news')}
        >
          News
        </button>
        <button
          className={activeTab === 'videos' ? 'active' : ''}
          onClick={() => setActiveTab('videos')}
        >
          Videos
        </button>
      </div>

      {/* Profile Tab (Wikipedia extract) */}
      {activeTab === 'profile' && (
        <div className="profile-section">
          {wikiLoading && <p>Loading profile…</p>}
          {!wikiLoading && wikiError && <p>{wikiError}</p>}
          {!wikiLoading && !wikiError && (
            <>
              {wikiExtract ? (
                <div
                  className="wiki-extract"
                  dangerouslySetInnerHTML={{ __html: wikiExtract }}
                />
              ) : (
                <p>No profile summary available.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Batting Tab */}
      {activeTab === 'batting' && (
        <div className="career-section">
          {orderedFormats.map((fmt) => {
            const rows = groupedBatting.get(fmt) || [];
            if (!rows.length) return null;
            return (
              <div key={`bat-sec-${fmt}`} className="format-section">
                <h4>{fmt}</h4>
                <table className="career-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="num">Matches</th>
                      <th className="num">Innings</th>
                      <th className="num">Runs</th>
                      <th className="num">Not Outs</th>
                      <th className="num">High</th>
                      <th className="num">Average</th>
                      <th className="num">Strike Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`bat-${fmt}-${i}`}>
                        <td>{r.seasonName || '—'}</td>
                        <td className="num">{showIfNum(r.matches)}</td>
                        <td className="num">{showIfNum(r.innings)}</td>
                        <td className="num">{showIfNum(r.runs)}</td>
                        <td className="num">{showIfNum(r.notOuts)}</td>
                        <td className="num">{showIfNum(r.high)}</td>
                        <td className="num">{to2(r.avg)}</td>
                        <td className="num">{to2(r.sr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Bowling Tab */}
      {activeTab === 'bowling' && (
        <div className="career-section">
          {orderedFormats.map((fmt) => {
            const rows = groupedBowling.get(fmt) || [];
            if (!rows.length) return null;
            return (
              <div key={`bowl-sec-${fmt}`} className="format-section">
                <h4>{fmt}</h4>
                <table className="career-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="num">Matches</th>
                      <th className="num">Innings</th>
                      <th className="num">Wickets</th>
                      <th className="num">Avg</th>
                      <th className="num">Economy</th>
                      <th className="num">Strike Rate</th>
                      <th className="num">5W</th>
                      <th className="num">10W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`bowl-${fmt}-${i}`}>
                        <td>{r.seasonName || '—'}</td>
                        <td className="num">{showIfNum(r.matches)}</td>
                        <td className="num">{showIfNum(r.innings)}</td>
                        <td className="num">{showIfNum(r.wickets)}</td>
                        <td className="num">{bowlingAvg(r.avg, r.wickets)}</td>
                        <td className="num">{to2(r.econ)}</td>
                        <td className="num">{bowlingSR(r.sr, r.wickets)}</td>
                        <td className="num">{showIfNum(r.five)}</td>
                        <td className="num">{showIfNum(r.ten)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="career-section">
          <NewsWrapper query={playerFullName} />
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="videos-section">
          <YouTubeVideoList matchQuery={playerFullName} />
        </div>
      )}
    </div>
  );
}
