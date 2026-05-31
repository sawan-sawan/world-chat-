import React, { useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";

export default function VoiceMessagePlayer({ audioUrl, durationMs = 0 }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMs / 1000);

  function togglePlayback() {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }

  function seek(event) {
    if (!audioRef.current) return;
    const nextTime = Number(event.target.value);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div className="voice-message">
      <audio
        ref={audioRef}
        preload="metadata"
        src={audioUrl}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || duration)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />

      <button className="voice-play-button" type="button" title={playing ? "Pause voice message" : "Play voice message"} onClick={togglePlayback}>
        {playing ? <Pause size={17} /> : <Play size={17} />}
      </button>

      <Mic className="voice-message-icon" size={15} />

      <div className="voice-timeline">
        <input
          type="range"
          min="0"
          max={Math.max(duration, 1)}
          step="0.01"
          value={Math.min(currentTime, Math.max(duration, 1))}
          aria-label="Voice message timeline"
          onChange={seek}
        />
        <span>{formatDuration(currentTime || duration)}</span>
      </div>
    </div>
  );
}

function formatDuration(value = 0) {
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
