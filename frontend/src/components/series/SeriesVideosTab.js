import React from "react";
import YouTubeVideoList from "../YouTubeVideoList";

export default function SeriesVideos({ seriesLabel }) {
  return (
    <div>
      <YouTubeVideoList matchQuery={seriesLabel} />
    </div>
  );
}
