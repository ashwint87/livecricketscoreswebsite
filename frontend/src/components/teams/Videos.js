import React from "react";
import YouTubeVideoList from "../YouTubeVideoList";

export default function Videos({ teamName }) {
  const query = `${teamName} Cricket Team`;

  return (
    <div>
      <YouTubeVideoList matchQuery={query} />
    </div>
  );
}
