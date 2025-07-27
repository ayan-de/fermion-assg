"use client";

import React, { useState } from "react";
import { useSocket, useWebRTC } from "../../hooks";
import { VideoStream } from "../../components";

const StreamPage: React.FC = () => {
  const [roomId] = useState("room-1"); // Default room for demo
  const { socket, isConnected } = useSocket("http://localhost:3001");
  const { localStream, isStreaming, startStreaming, stopStreaming } = useWebRTC(
    {
      socket,
      roomId,
    }
  );

  const handleToggleStreaming = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Live Stream</h1>

      {/* Connection Status */}
      <div style={{ marginBottom: "20px" }}>
        <p>
          Status:{" "}
          {isConnected ? (
            <span style={{ color: "green" }}>✓ Connected</span>
          ) : (
            <span style={{ color: "red" }}>✗ Disconnected</span>
          )}
        </p>
        <p>Room ID: {roomId}</p>
      </div>

      {/* Video Preview */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Your Stream Preview</h3>
        <VideoStream stream={localStream} muted={true} />
      </div>

      {/* Controls */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleToggleStreaming}
          disabled={!isConnected}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isStreaming ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "pointer" : "not-allowed",
            opacity: isConnected ? 1 : 0.5,
          }}
        >
          {isStreaming ? "Stop Streaming" : "Start Streaming"}
        </button>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "5px",
        }}
      >
        <h4>Instructions:</h4>
        <ol>
          <li>Click "Start Streaming" to begin broadcasting</li>
          <li>Allow camera and microphone permissions</li>
          <li>Other users can join this room to see your stream</li>
          <li>Viewers can watch at /watch page</li>
        </ol>
      </div>
    </div>
  );
};

export default StreamPage;
