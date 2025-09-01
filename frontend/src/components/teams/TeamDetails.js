import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getTeamRuns, matchYear } from './../../utils/matchUtils';
import {
  completedMatchStatuses,
  upcomingMatchStatuses,
} from './../../constants/matchStatusConstants';
import { useTeamInfo } from './../../context/TeamInfoContext';
import CountdownTimer from './../CountdownTimer';
import NotificationButton from './../NotificationButton';
import LiveMatches from './TeamLiveMatches';
import News from './News';
import Videos from './Videos';
import TeamPlayers from './TeamPlayers';
import './../css/Matches.css';
import TeamsUCMatchCard from '../TeamsUCMatchCard';

export default function Matches() {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamNames, setTeamNames] = useState({});
  const [flagNames, setFlagNames] = useState({});
  const [venueData, setVenueData] = useState({});
  const [leagueData, setLeagueData] = useState({});
  const [stageData, setStageData] = useState({});
  const [playerNames, setPlayerNames] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [players, setPlayers] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { teamName } = location.state || {};
  const { getTeamInfo } = useTeamInfo();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1) Fetch all fixtures for the team
      const fixturesRes = await axios.get(`/api/teams/${id}/matches`);
      const allMatches = fixturesRes.data.data || [];

      // 2) Identify IDs needed for enrichment
      const teamIds = new Set();
      const venueIds = new Set();
      const stageIds = new Set();
      const leagueIds = new Set();

      allMatches.forEach(m => {
        teamIds.add(m.localteam_id);
        teamIds.add(m.visitorteam_id);
        venueIds.add(m.venue_id);
        stageIds.add(m.stage_id);
        leagueIds.add(m.league_id);
      });

      // 3) Resolve team names and flags
      const names = {};
      const flags = {};
      await Promise.all([...teamIds].map(async (teamId) => {
        try {
          const team = await getTeamInfo(teamId);
          names[teamId] = team.name;
          flags[teamId] = team.image_path;
        } catch {
          names[teamId] = 'Unknown';
        }
      }));
      setTeamNames(names);
      setFlagNames(flags);

      // 4) Resolve venue info
      const venues = {};
      await Promise.all([...venueIds].map(async (venueId) => {
        try {
          const res = await axios.get(`/api/venues/${venueId}`);
          venues[venueId] = res.data.data;
        } catch {
          venues[venueId] = {};
        }
      }));
      setVenueData(venues);

      // 5) Resolve league names
      const leagues = {};
      await Promise.all([...leagueIds].map(async (leagueId) => {
        try {
          const res = await axios.get(`/api/leagues/${leagueId}`);
          leagues[leagueId] = res.data.data.data.name;
        } catch {
          leagues[leagueId] = {};
        }
      }));
      setLeagueData(leagues);

      // 6) Resolve stage names
      const stages = {};
      await Promise.all([...stageIds].map(async (stageId) => {
        try {
          const res = await axios.get(`/api/stages/${stageId}`);
          stages[stageId] = res.data.data.data.name;
        } catch {
          stages[stageId] = {};
        }
      }));
      setStageData(stages);

      // 7) For completed matches missing team details, fetch full match info
      const completedMatchIds = allMatches
        .filter(m => completedMatchStatuses.includes(m.status) && (!m.localteam || !m.visitorteam))
        .map(m => m.id);

      let enrichedMatches = allMatches;
      if (completedMatchIds.length > 0) {
        enrichedMatches = await Promise.all(
          allMatches.map(async (m) => {
            if (!completedMatchIds.includes(m.id)) return m;
            try {
              const res = await axios.get(`/api/match/${m.id}`);
              // merge full match data over existing
              return { ...m, ...res.data.data };
            } catch (err) {
              console.error(`Error fetching match ${m.id}`, err);
              return m;
            }
          })
        );
      }

      setMatches(enrichedMatches);

    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

  useEffect(() => {
    const fetchManOfMatchPlayers = async () => {
      const ids = matches
        .filter(m => m.status === 'Finished' && m.man_of_match_id)
        .map(m => m.man_of_match_id);

      const uniqueIds = [...new Set(ids)];

      const names = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const res = await axios.get(`/api/player-names/${id}`);
          names[id] = res.data.data.data.fullname || 'Unknown';
        } catch {
          names[id] = 'Unknown';
        }
      }));

      setPlayerNames(names);
    };

    if (!loading) fetchManOfMatchPlayers();
  }, [matches, loading]);

  useEffect(() => {
    async function fetchLiveMatches() {
      try {
        const res = await axios.get(`/api/teams/${id}/live-matches`);
        setLiveMatches(res.data.data || []);
      } catch (err) {
        console.error('Error fetching live matches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveMatches();
  }, [id]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await axios.get(`/api/team-squads/${id}`);
        const allPlayers = res.data.data.data?.squad || [];
        const playersWithSeason = allPlayers.filter(p => p.squad?.season_id);

        const seasonIds = [...new Set(playersWithSeason.map(p => p.squad.season_id))];
        const top3Seasons = seasonIds.sort((a, b) => b - a).slice(0, 7);

        const latestSquad = playersWithSeason.filter(p => top3Seasons.includes(p.squad.season_id)).reduce((acc, player) => {
          if (!acc.some(p => p.id === player.id)) acc.push(player);
          return acc;
        }, []);

        setPlayers(latestSquad);
      } catch (err) {
        console.error(`❌ Failed fetching players for ${teamName}`, err);
      }
    }
    fetchPlayers();
  }, [id]);

  const getFlagName = (tid) => flagNames[tid] || '';
  const getTeamName = (tid) => teamNames[tid] || teamName || 'TBD';
  const getVenueName = (vid) => venueData[vid]?.name || '';
  const getVenueCity = (vid) => venueData[vid]?.city || '';
  const getStageName = (sid) => stageData[sid] || '';
  const getLeagueName = (lid) => leagueData[lid] || '';

  const upcomingMatches = matches.filter(m => upcomingMatchStatuses.includes(m.status));
  const completedMatches = matches.filter(m => completedMatchStatuses.includes(m.status));

  const tabData = [
    { key: 'upcoming', label: 'Upcoming', data: upcomingMatches },
    { key: 'completed', label: 'Completed', data: completedMatches },
    { key: 'live', label: 'Live', data: liveMatches },
    { key: 'players', label: 'Players', data: players },
    { key: 'news', label: 'News', data: [1] },
    { key: 'videos', label: 'Videos', data: [1] },
  ];

  const availableTabs = tabData.filter(t => t.key === 'news' || t.data.length > 0);
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].key : 'completed';

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const currentMatches = tabData.find(tab => tab.key === activeTab)?.data || [];

  const seriesDefaultLabel = (match) => {
    const stageName = getStageName(match.stage_id);

    if (/Regular|Play Offs|County|Group/i.test(stageName) && match?.league_id) {
      const leagueName = getLeagueName(match.league_id);
      return `${leagueName} (${stageName})`;
    } else {
      return `${stageName} ${matchYear(match)}`;
    }
  };

  return (
    <div className="team-matches">
      <h2>{getTeamName(id)} Cricket Team</h2>

      <div className="tabs">
        {availableTabs.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading matches...</p>
      ) : activeTab === 'players' ? (
        <TeamPlayers teamName={getTeamName(id)} teamPlayers={players} />
      ) : activeTab === 'news' ? (
        <News teamName={getTeamName(id)} />
      ) : activeTab === 'videos' ? (
        <Videos teamName={getTeamName(id)} />
      ) : activeTab === 'live' ? (
        <LiveMatches teamName={getTeamName(id)} matches={liveMatches}/>
      ) : (
        <>
          {currentMatches.length === 0 && (
            <p>
              No {activeTab} matches available.
            </p>
          )}

          <TeamsUCMatchCard
            matches={currentMatches}
            getFlagName={getFlagName}
            getTeamName={getTeamName}
            getVenueName={getVenueName}
            getVenueCity={getVenueCity}
            seriesDefaultLabel={seriesDefaultLabel}
            playerNames={playerNames}
            upcomingMatchStatuses={upcomingMatchStatuses}
          />
        </>
      )}
    </div>
  );
}
