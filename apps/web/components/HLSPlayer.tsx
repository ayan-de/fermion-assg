import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const HLSPlayer: React.FC<HLSPlayerProps> = ({
  src,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      // Create HLS instance
      const hls = new Hls({
        enableWorker: false,
      });

      hlsRef.current = hls;

      // Load source
      hls.loadSource(src);
      hls.attachMedia(video);

      // Handle HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest loaded");
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          setError("Failed to load video stream");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
    } else {
      setError("HLS is not supported in this browser");
    }

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  if (error) {
    return (
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
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            borderRadius: "8px",
            zIndex: 1,
          }}
        >
          Loading stream...
        </div>
      )}
      <video
        ref={videoRef}
        controls
        style={{
          width: "100%",
          height: "400px",
          backgroundColor: "#000",
          borderRadius: "8px",
        }}
      />
    </div>
  );
};
