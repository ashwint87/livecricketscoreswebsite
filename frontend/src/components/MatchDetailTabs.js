import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ScorecardTab from './match/ScorecardTab';
import CommentaryTab from './match/CommentaryTab';
import LineupTab from './match/LineupTab';
import OversSummaryTab from './match/OversSummaryTab';
import PartnershipTab from './match/PartnershipTab';
import NewsTab from './match/NewsTab';
import HighlightsTab from './match/HighlightsTab';

export default function MatchDetailTabs({ matchId, matchInfo }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const hasBatting = Array.isArray(matchInfo.batting) && matchInfo.batting.length > 0;
  const hasLineup = Array.isArray(matchInfo.lineup) && matchInfo.lineup.length > 0;

  // Determine default tab based on data
  const defaultTab = hasBatting ? 'scorecard' : 'videos';
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || defaultTab);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  // Build tabs dynamically
  let tabs = {
    videos: <HighlightsTab matchId={matchId} matchInfo={matchInfo} />,
    news: <NewsTab matchId={matchId} matchInfo={matchInfo} />,
  };

  if (hasLineup) {
    tabs.lineup = <LineupTab matchId={matchId} matchInfo={matchInfo} />;
  }

  if (hasBatting) {
    tabs = {
      scorecard: <ScorecardTab matchId={matchId} matchInfo={matchInfo} />,
      commentary: <CommentaryTab matchId={matchId} matchInfo={matchInfo} />,
      overs: <OversSummaryTab matchId={matchId} matchInfo={matchInfo} />,
      partnership: <PartnershipTab matchId={matchId} matchInfo={matchInfo} />,
      ...tabs,
    };
  }

  return (
    <div>
      <div className="tabs">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
            style={{ marginRight: '10px' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content" style={{ marginTop: '20px' }}>
        {tabs[activeTab]}
      </div>
    </div>
  );
}
