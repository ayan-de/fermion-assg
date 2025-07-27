"use client";

import React, { useState, useEffect } from "react";
import { HLSPlayer } from "../../components/HLSPlayer";

const WatchPage: React.FC = () => {
  const [roomId] = useState("room-1"); // Same room as streamers
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch HLS URL from backend
  useEffect(() => {
    const fetchHlsUrl = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/hls/${roomId}`);

        if (!response.ok) {
          throw new Error("Failed to get HLS URL");
        }

        const data = await response.json();
        setHlsUrl(data.hlsUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHlsUrl();

    // Poll for HLS URL every 5 seconds in case stream starts later
    const interval = setInterval(fetchHlsUrl, 5000);

    return () => clearInterval(interval);
  }, [roomId]);

  const handleRefresh = () => {
    setError(null);
    setIsLoading(true);
    // Re-fetch HLS URL
    setTimeout(() => {
      fetch(`http://localhost:3001/api/hls/${roomId}`)
        .then((response) => response.json())
        .then((data) => {
          setHlsUrl(data.hlsUrl);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }, 1000);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Live Stream Viewer</h1>

      {/* Room Info */}
      <div style={{ marginBottom: "20px" }}>
        <p>Watching Room: {roomId}</p>
      </div>

      {/* Video Player */}
      <div style={{ marginBottom: "20px" }}>
        {isLoading ? (
          <div
            style={{
              width: "100%",
              height: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              color: "#666",
            }}
          >
            Loading stream...
          </div>
        ) : error ? (
          <div
            style={{
              width: "100%",
              height: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              color: "#666",
            }}
          >
            <p>Stream not available</p>
            <p style={{ fontSize: "14px" }}>{error}</p>
            <button
              onClick={handleRefresh}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : hlsUrl ? (
          <HLSPlayer src={hlsUrl} autoPlay={true} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              color: "#666",
            }}
          >
            No stream available
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleRefresh}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Refresh Stream
        </button>
      </div>

      {/* Stream Info */}
      <div
        style={{
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "5px",
        }}
      >
        <h4>Stream Information:</h4>
        <ul>
          <li>Stream Format: HLS (HTTP Live Streaming)</li>
          <li>Latency: ~6-10 seconds (typical for HLS)</li>
          <li>Quality: 720p @ 30fps</li>
          <li>Audio: AAC 128kbps</li>
        </ul>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
          Note: Stream will appear here once broadcasters start streaming in the
          /stream page
        </p>
      </div>
    </div>
  );
};

export default WatchPage;
