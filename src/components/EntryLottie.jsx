import React, { useEffect, useRef } from "react";
import Lottie from "lottie-react";

export default function EntryLottie({ speed = 1, ...props }) {
  const lottieRef = useRef(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(speed);
  }, [speed]);

  return <Lottie {...props} lottieRef={lottieRef} />;
}
