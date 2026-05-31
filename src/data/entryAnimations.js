import confettiAnimation from "../assets/confetti.json";

export const DEFAULT_ENTRY_ANIMATION_ID = "classic-confetti";

export const ENTRY_ANIMATIONS = [
  {
    id: "classic-confetti",
    name: "Classic Confetti",
    description: "A bright celebration burst for a lively room entrance.",
    animationData: confettiAnimation,
    speed: 1,
  },
  {
    id: "quick-burst",
    name: "Quick Burst",
    description: "A faster pop with a compact finish for an energetic hello.",
    animationData: confettiAnimation,
    speed: 1.45,
  },
  {
    id: "soft-celebration",
    name: "Soft Celebration",
    description: "A calmer, wider confetti moment with a softer entrance.",
    animationData: confettiAnimation,
    speed: 0.72,
  },
];

export function getEntryAnimation(animationId) {
  return (
    ENTRY_ANIMATIONS.find((animation) => animation.id === animationId) ||
    ENTRY_ANIMATIONS[0]
  );
}
