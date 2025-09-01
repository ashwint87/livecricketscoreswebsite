import React from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import NotificationButton from './NotificationButton';
import {
  getTeamRuns,
  getTossWinnerName,
  getTossDecision,
} from '../utils/matchUtils';
import {
  upcomingMatchStatuses,
  completedMatchStatuses,
  liveMatchStatuses,
  otherMatchStatuses
} from '../constants/matchStatusConstants';
import './css/MatchCard.css';

const getMatchCategory = (status) => {
  if (upcomingMatchStatuses.includes(status)) return 'UPCOMING';
  if (completedMatchStatuses.includes(status)) return 'RESULT';
  if (liveMatchStatuses.includes(status)) return 'LIVE';
  if (otherMatchStatuses.includes(status)) return 'LIVE';
  return status || 'UNKNOWN';
};

export default function TeamsUCMatchCard({
  matches = [],
  getTeamName,
  getFlagName,
  getVenueName,
  getVenueCity,
  seriesDefaultLabel
}) {
  const navigate = useNavigate();

  return (
    <div className="match-list">
      {matches.map((match) => {
        const venue = `${getVenueName(match.venue_id)} Cricket Stadium`;

        return (
          <div className="match-card">
            <div className="match-header">
              <span className={`status-label ${getMatchCategory(match.status).toLowerCase()}`}>
                {getMatchCategory(match.status)}
              </span>
              <span className="dot"></span>
              <span>{seriesDefaultLabel(match)}</span>
            </div>

            <div className="match-subtitle">
              {match.round} ·
              {getVenueName(match.venue_id) === 'TBD' ? (
                <span className="match-venue">{getVenueName(match.venue_id)}</span>
              ) : (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(venue)}`}
                  className="location-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="location-icon"></span>
                  <span className="match-venue-wrapper" data-fullname={getVenueName(match.venue_id)}>
                    <span className="match-venue">{getVenueName(match.venue_id)}</span>
                  </span>
                </a>
              )}
            </div>

            <div className="team-block">
              <div className="team-row">
                <div className="team-name">
                  <img src={getFlagName(match.localteam_id)} alt="" className="flag-icon" />
                  {getTeamName(match.localteam_id)}
                </div>
                <div className="score">
                  {upcomingMatchStatuses.includes(match.status)
                    ? new Date(match.starting_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short'
                      })
                    : getTeamRuns(match, match.localteam_id)}
                </div>
              </div>

              <div className="team-row">
                <div className="team-name">
                  <img src={getFlagName(match.visitorteam_id)} alt="" className="flag-icon" />
                  {getTeamName(match.visitorteam_id)}
                </div>
                <div className="score">
                  {upcomingMatchStatuses.includes(match.status)
                    ? new Date(match.starting_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }).toUpperCase()
                    : getTeamRuns(match, match.visitorteam_id)}
                </div>
              </div>
            </div>

            {upcomingMatchStatuses.includes(match.status) ? (
              <div className="status-note upcoming">
                <div className="scrolling-text">
                  <CountdownTimer startTime={match.starting_at} offsetMs={600000} />
                </div>
              </div>
            ) : match.note ? (
              <div className={`status-note ${getMatchCategory(match.status).toLowerCase()}`}>
                <div className="scrolling-text">{match.note}</div>
              </div>
            ) : (
              match.toss_won_team_id && match.elected && (
                <div className="status-note">
                  <div className="scrolling-text">
                    {getTossWinnerName(match)} won the toss and elected to {getTossDecision(match)}
                  </div>
                </div>
              )
            )}

            <div className="card-footer">
              <div onClick={(e) => { e.stopPropagation(); navigate(`/schedule`); }}>
                Schedule
              </div>
              {upcomingMatchStatuses.includes(match.status) ? (
                <>
                  <div onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}`); }}>
                    Match Info
                  </div>

                  {match.lineup?.length > 0 && (
                    <div
                      className="lineup-out-message"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/match/${match.id}?tab=lineup`);
                      }}
                    >
                      Lineup Out
                    </div>
                  )}
                </>
              ) : (
                <div onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}`); }}>
                  Scorecard
                </div>
              )}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/series/${match.stage_id}/${match.season_id}`, {
                    state: {
                      seriesLabel: seriesDefaultLabel(match),
                      seriesCode: match?.type,
                    },
                  });
                }}
              >
                Series
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
