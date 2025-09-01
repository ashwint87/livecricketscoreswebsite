import React, { useEffect, useState } from "react";

function YouTubeVideoList({ matchQuery }) {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`/api/videos?q=${encodeURIComponent(matchQuery)}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          console.error("Invalid response format", data);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };

    fetchVideos();
  }, [matchQuery]);

  if (!videos) return <div>No videos available at the moment.</div>;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {videos.map((video) => (
          <div key={video.id.videoId} style={{ width: "480px" }}>
            <iframe
              width="100%"
              height="270"
              src={`https://www.youtube.com/embed/${video.id.videoId}`}
              title={video.snippet.title}
              allowFullScreen
              frameBorder="0"
            ></iframe>
            <h4>{video.snippet.title}</h4>
            <p>{video.snippet.channelTitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YouTubeVideoList;
