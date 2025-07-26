"use client";

import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { VideoPlayer } from "../../components/VideoPlayer";

export default function WatchPage() {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(setStream);
  }, []);

  return (
    <div className="p-4">
      <Header
        status="You are now watching stream"
        buttonText="Back to Home"
        buttonLink="/"
      />
      <div className="flex gap-4">
        <div className="flex-1">
          <h2 className="mb-1 text-lg font-semibold">🟢 Stream</h2>
          {stream && <VideoPlayer stream={stream} />}
        </div>
      </div>
    </div>
  );
}
