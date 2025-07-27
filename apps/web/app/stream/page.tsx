"use client";

import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { VideoPlayer } from "../../components/VideoStream";

export default function StreamPage() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // In a real application, you would use a WebRTC library to handle streaming.
    // For this example, we'll use placeholders.
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(setLocalStream);

    // Simulate receiving a remote stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(setRemoteStream);
  }, []);

  return (
    <div className="p-4">
      <Header status="Connected" buttonText="Back to Home" buttonLink="/" />
      <div className="flex gap-4">
        <div className="flex-1">
          <h2 className="mb-1 text-lg font-semibold">🟢 Local Stream</h2>
          {localStream && <VideoPlayer stream={localStream} />}
        </div>
        <div className="flex-1">
          <h2 className="mb-1 text-lg font-semibold">🔴 Remote Stream</h2>
          {remoteStream && <VideoPlayer stream={remoteStream} />}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Open this page in another browser window or incognito mode to see the
        remote stream.
      </p>
    </div>
  );
}
