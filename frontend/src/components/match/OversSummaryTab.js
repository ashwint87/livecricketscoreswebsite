import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { dismissalsToShowAsW } from './../../constants/matchStatusConstants';

export default function OversSummaryTab({ matchId, matchInfo }) {
  const [balls, setBalls] = useState([]);
  const [innings, setInnings] = useState({});

  const matchData = matchInfo || {};
  const allBalls = matchData.balls || [];
  const grouped = {};

  allBalls.forEach(ball => {
    const inning = ball.scoreboard || 'Inning';
    const over = Math.floor(ball.ball) + 1;

    if (!grouped[inning]) grouped[inning] = {};
    if (!grouped[inning][over]) grouped[inning][over] = [];

    grouped[inning][over].push(ball);
  });

useEffect(() => {
  const cacheKey = `overs_${matchId}`;

  if (matchInfo?.balls?.length) {
    setInnings(grouped);
    setBalls(allBalls);

    try {
      const cacheData = JSON.stringify({ grouped, allBalls });

      // Only cache if size is under 5MB (5000000 characters)
      if (cacheData.length < 5000000) {
        localStorage.setItem(cacheKey, cacheData);
      } else {
        console.warn("Cache too large, skipping localStorage.");
      }
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn("Quota exceeded. Removing cache key only.");
        localStorage.removeItem(cacheKey);
      }
    }
  } else {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setInnings(parsed.grouped);
        setBalls(parsed.allBalls);
      } catch (e) {
        console.warn("Corrupted cache. Clearing it.");
        localStorage.removeItem(cacheKey);
      }
    }
  }
}, [matchInfo, matchId]);

  const getBallDisplay = (ball) => {
    const name = ball?.score?.name || '';
    const runs = ball?.score?.runs ?? '';

    if (dismissalsToShowAsW.includes(name)) return 'W';
    if (name === "Retired Hurt") return 'RH';
    if (runs === 0) return '0';
    if (runs === 4) return '4';
    if (runs === 6) return '6';
    return runs.toString();
  };

  const getTeamNameForScoreboard = (scoreboardCode) => {
    if (!matchData?.batting?.length) return scoreboardCode;
    const entry = matchData.batting.find(b => b.scoreboard === scoreboardCode);
    const teamId = entry?.team_id;
    if (teamId === matchData.localteam_id) return matchData.localteam?.name || 'Local Team';
    if (teamId === matchData.visitorteam_id) return matchData.visitorteam?.name || 'Visitor Team';
    return `Team ${teamId}`;
  };

  if (!matchInfo) return <div>No overs summary available at the moment.</div>;

  return (
    <div className="overs-summary-tab">
      <h3>Overs Summary</h3>

      {Object.entries(innings).map(([scoreboard, overs]) => (
        <div key={scoreboard}>
          <h4>{getTeamNameForScoreboard(scoreboard)}</h4>
          {Object.keys(overs)
            .sort((a, b) => b - a)
            .map(over => {
              const ballsInOver = overs[over];

              return (
                <div key={over} style={{ marginBottom: '10px' }}>
                  <strong>Over {over}:</strong>{' '}
                  {ballsInOver.map(ball => (
                    <span key={ball.id} style={{ marginRight: 6 }}>
                      {getBallDisplay(ball)}
                    </span>
                  ))}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
