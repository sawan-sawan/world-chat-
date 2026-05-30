import Lottie from "lottie-react";
import confettiAnimation from "../assets/confetti-entry.json";

export default function EntryAnimation({ notice }) {
  if (!notice) return null;

  return (
    <div className="entry-animation" key={notice.id}>
      <Lottie
        animationData={confettiAnimation}
        autoplay
        loop={false}
        className="entry-animation-confetti"
      />
      <div className="entry-animation-label">
        <strong>{notice.text}</strong>
        <span>Welcome to the room</span>
      </div>
    </div>
  );
}
