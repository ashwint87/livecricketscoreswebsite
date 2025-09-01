import React, { useEffect, useRef, useState } from 'react';
import { useSchedule } from './../../context/ScheduleContext';
import {
  liveStatuses,
  upcomingMatchStatuses,
  completedMatchStatuses,
} from './../../constants/matchStatusConstants';
import MatchCard from './../MatchCard';
import './css/FeaturedMatches.css';

const FeaturedMatches = () => {
  const { matches = [], loading } = useSchedule();
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [stages, setStages] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef();

  // Utility to format stage name
  const getDisplayStageName = (match) => {
    const stageName = match.stage?.name || '';
    if (/Regular|Play Offs|County|Group/i.test(stageName) && match.league?.name) {
      return `${match.league.name} (${stageName})`;
    }
    return stageName || match.league?.name || 'Unknown';
  };

  useEffect(() => {
    if (loading || !Array.isArray(matches)) return;

    const live = [];
    const upcoming = [];
    const completed = [];

    const now = Date.now();
    const next48h = now + 48 * 60 * 60 * 1000;

    matches.forEach((m) => {
      const matchDate = new Date(m.starting_at);
      const isLive = liveStatuses.includes(m.status);
      const isUpcoming =
        upcomingMatchStatuses.includes(m.status) &&
        matchDate >= new Date(now) &&
        matchDate <= new Date(next48h);
      const isCompleted =
        completedMatchStatuses.includes(m.status) &&
        matchDate >= new Date(now - 2 * 24 * 60 * 60 * 1000); // last 2 days

      if (isLive) live.push(m);
      else if (isUpcoming) upcoming.push(m);
      else if (isCompleted) completed.push(m);
    });

    const sortByDate = (a, b) => new Date(a.starting_at) - new Date(b.starting_at);
    live.sort(sortByDate);
    upcoming.sort(sortByDate);
    completed.sort(sortByDate);

    const stageMatchMap = {};
    const stageList = new Set();
    const allFiltered = [];

    const processMatches = (matchArray, maxPerStage) => {
      for (const match of matchArray) {
        const displayStage = getDisplayStageName(match);
        stageList.add(displayStage);
        stageMatchMap[displayStage] = stageMatchMap[displayStage] || [];

        if (
          maxPerStage === Infinity ||
          stageMatchMap[displayStage].length < maxPerStage
        ) {
          stageMatchMap[displayStage].push(match);
          allFiltered.push(match);
        }
      }
    };

    processMatches(live, Infinity);
    processMatches(upcoming, 2);
    processMatches(completed, 2);

    setFilteredMatches(allFiltered);
    setStages(Array.from(stageList));
  }, [matches, loading]);

  const visibleMatches = filteredMatches.filter((match) =>
    !activeStage || getDisplayStageName(match) === activeStage
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleResize = () => {
      const totalScrollWidth = container.scrollWidth;
      const visibleWidth = container.clientWidth;
      const totalPages = Math.ceil(totalScrollWidth / visibleWidth);
      setPageCount(totalPages);
    };

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const page = Math.round(scrollLeft / container.clientWidth);
      setCurrentPage(page);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [visibleMatches]);

  return (
    <div className="featured-container">
      <div className="featured-tabs-row">
        <div className="featured-tabs-left">
          <span
            className={`tab ${!activeStage ? 'active-tab' : ''}`}
            onClick={() => setActiveStage(null)}
          >
            All Featured Matches
          </span>
          {stages.map((stage) => (
            <span
              key={stage}
              className={`tab ${activeStage === stage ? 'active-tab' : ''}`}
              onClick={() => setActiveStage(stage)}
            >
              {stage}
            </span>
          ))}
        </div>
        <a href="/schedule" className="see-all-btn">All</a>
      </div>

      <div className="match-cards-scroll-wrapper" ref={scrollRef}>
        <div className={`match-cards-scroll ${visibleMatches.length < 3 ? 'center' : ''}`}>
          {visibleMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>

      <div className="pagination-dots">
        {Array.from({ length: Math.max(1, pageCount - 1) }).map((_, i) => (
          <span
            key={i}
            className={`dot ${i === currentPage ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedMatches;
