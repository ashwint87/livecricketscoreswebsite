import React from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import NotificationButton from './NotificationButton';
import {
  getTeamRuns,
  venueName,
  getTossWinnerName,
  getTossDecision,
  matchStageName,
  getTeamName
} from '../utils/matchUtils';
import { formatDateWithSuffix, getDaysToGo } from '../utils/dateUtils';
import {
  upcomingMatchStatuses,
  completedMatchStatuses,
  liveMatchStatuses,
  otherMatchStatuses
} from './../constants/matchStatusConstants';
import './css/ScheduleMatchCard.css';

const getMatchCategory = (status) => {
  if (upcomingMatchStatuses.includes(status)) return 'UPCOMING';
  if (completedMatchStatuses.includes(status)) return 'RESULT';
  if (liveMatchStatuses.includes(status)) return 'LIVE';
  if (otherMatchStatuses.includes(status)) return 'LIVE';
  return status || 'UNKNOWN';
};

export default function TeamsMatchCard({ match }) {
  const navigate = useNavigate();

  const venue = venueName(match) + ' Cricket Stadium';

  return (
    <div className="match-card">
      <div className="match-header">
        <span className={`status-label ${getMatchCategory(match.status).toLowerCase()}`}>
          {getMatchCategory(match.status)}
        </span>
        <span className="dot"></span>
        <span>{matchStageName(match)}</span>
      </div>

      <div className="match-subtitle">
        {match.round} ·
        {venueName(match) === 'TBD' ? (
          <span className="match-venue">{venueName(match)}</span>
        ) : (
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(venue)}`}
            className="location-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="location-icon"></span>
            <span className="match-venue-wrapper" data-fullname={venueName(match)}>
              <span className="match-venue">{venueName(match)}</span>
            </span>
          </a>
        )}
      </div>

      {upcomingMatchStatuses.includes(match.status) ? (
        <div className="team-block">
          <div className="team-row">
            <div className="team-name">
              {getTeamName(match.localteam_id, match)}
            </div>

            <div className="vs-text">VS</div>
            <div className="team-name-right">
              {getTeamName(match.visitorteam_id, match)}
            </div>
          </div>
        </div>
      ) : (
        <div className="team-block">
          <div className="team-row">
            <div className="team-name">
              {getTeamName(match.localteam_id, match)}
            </div>
            <div className="score">
              {upcomingMatchStatuses.includes(match.status)
                ? new Date(match.starting_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short'
                  })
                : getTeamRuns(match, match.localteam.id)}
            </div>
          </div>

          <div className="team-row">
            <div className="team-name">
              {getTeamName(match.visitorteam_id, match)}
            </div>
            <div className="score">
              {upcomingMatchStatuses.includes(match.status)
                ? new Date(match.starting_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }).toUpperCase()
                : getTeamRuns(match, match.visitorteam.id)}
            </div>
          </div>
        </div>
      )}

      {upcomingMatchStatuses.includes(match.status) ? (
        <div className="status-note upcoming">
          {formatDateWithSuffix(match.starting_at)} | {""}
          {new Date(match.starting_at).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).toUpperCase()}
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

      {upcomingMatchStatuses.includes(match.status) ? (
        <div className="card-footer">
          <div>
            {getDaysToGo(match.starting_at)}
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

          <div onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}`); }}>
            Match Info
          </div>
        </div>
      ) : (
        <div className="card-footer">
          <div onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}`); }}>
            Scorecard
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/series/${match.stage_id}/${match.season_id}`, {
                state: {
                  seriesLabel: matchStageName(match),
                  seriesCode: match?.type,
                },
              });
            }}
          >
            Series
          </div>
        </div>
      )}
    </div>
  );
}
