import React, { useRef, useEffect } from "react";

interface VideoStreamProps {
  stream: MediaStream | null;
  muted?: boolean;
  autoPlay?: boolean;
}

export const VideoStream: React.FC<VideoStreamProps> = ({
  stream,
  muted = false,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      style={{
        width: "100%",
        height: "400px",
        backgroundColor: "#000",
        borderRadius: "8px",
      }}
    />
  );
};
