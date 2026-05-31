import React from "react";
import EntryLottie from "./EntryLottie";

export default function EntryMedia({
  animation,
  className,
  loop = false,
}) {
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
