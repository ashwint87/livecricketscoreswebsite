import React from "react";
import YouTubeVideoList from "../YouTubeVideoList";
import './css/Videos.css';

export default function SeriesVideos({ seriesLabel }) {
  const topCricketVideos = "Latest Cricket News";

  return (
    <div>
      <h3 className="header">Featured Videos</h3>
      <YouTubeVideoList matchQuery={topCricketVideos} />
    </div>
  );
}
