import React, { useEffect, useRef } from "react";
import EntryLottie from "./EntryLottie";

export default function EntryMedia({
  animation,
  className,
  loop = false,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (animation.type !== "video") return;
    videoRef.current.playbackRate = animation.playbackRate || 1;
  }, [animation]);

  if (animation.type === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        src={animation.videoSrc}
        autoPlay
        loop={loop}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <EntryLottie
      animationData={animation.animationData}
      loop={loop}
      autoplay
      speed={animation.speed}
      className={className}
    />
  );
}
