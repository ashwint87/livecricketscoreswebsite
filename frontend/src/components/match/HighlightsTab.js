import React from "react";
import YouTubeVideoList from "../YouTubeVideoList";

export default function HighlightsTab({ matchId, matchInfo }) {
  if (!matchInfo) return <div>No highlights available at the moment.</div>;

  let matchName;
  if (matchInfo.status === 'NS') {
    matchName = `${matchInfo?.localteam?.name} vs ${matchInfo?.visitorteam?.name}, ${matchInfo?.round} Match Preview`;
  } else {
    matchName = `${matchInfo?.localteam?.name} vs ${matchInfo?.visitorteam?.name}, ${matchInfo?.round} Match Highlights`;
  }

  return (
    <div>
      <YouTubeVideoList matchQuery={matchName} />
    </div>
  );
}
