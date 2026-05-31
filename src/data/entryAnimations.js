import confettiAnimation from "../assets/confetti.json";
import legendaryAuraOne from "../assets/File 00001.json";
import legendaryAuraTwo from "../assets/File 00002.json";
import legendaryAuraThree from "../assets/File 00003.json";
import legendaryAuraFour from "../assets/File 00004.json";
import legendaryAuraFive from "../assets/File 00005.json";
import legendaryAuraSix from "../assets/File 00006.json";
import legendaryAuraSeven from "../assets/File 00007.json";
import legendaryAuraEight from "../assets/File 00008.json";
import legendaryAuraNine from "../assets/File 00009.json";
import legendaryAuraTen from "../assets/File 00010.json";

export const DEFAULT_ENTRY_ANIMATION_ID = "classic-confetti";

export const ENTRY_ANIMATIONS = [
  {
    id: "classic-confetti",
    type: "lottie",
    name: "Classic Confetti",
    description: "A bright celebration burst for a lively room entrance.",
    tier: "free",
    animationData: confettiAnimation,
    speed: 1,
    gradient: "linear-gradient(135deg, #18b8f5, #2563eb)",
    glow: "rgba(37, 99, 235, 0.35)",
  },
  {
    id: "quick-burst",
    type: "lottie",
    name: "Quick Burst",
    description: "A faster pop with a compact finish for an energetic hello.",
    tier: "free",
    animationData: confettiAnimation,
    speed: 1.45,
    gradient: "linear-gradient(135deg, #f97316, #e11d48)",
    glow: "rgba(225, 29, 72, 0.34)",
  },
  {
    id: "soft-celebration",
    type: "lottie",
    name: "Soft Celebration",
    description: "A calmer, wider confetti moment with a softer entrance.",
    tier: "free",
    animationData: confettiAnimation,
    speed: 0.72,
    gradient: "linear-gradient(135deg, #10b981, #0f766e)",
    glow: "rgba(15, 118, 110, 0.34)",
  },
  {
    id: "legendary-aura-one",
    type: "lottie",
    name: "Legendary Aura 01",
    description: "A radiant legendary entrance with a focused energy reveal.",
    tier: "legendary",
    animationData: legendaryAuraOne,
    speed: 1,
    gradient: "linear-gradient(135deg, #f59e0b, #e11d48)",
    glow: "rgba(245, 158, 11, 0.56)",
  },
  {
    id: "legendary-aura-two",
    type: "lottie",
    name: "Legendary Aura 02",
    description: "A sharp legendary motion burst with an electric finish.",
    tier: "legendary",
    animationData: legendaryAuraTwo,
    speed: 1,
    gradient: "linear-gradient(135deg, #22d3ee, #2563eb)",
    glow: "rgba(34, 211, 238, 0.56)",
  },
  {
    id: "legendary-aura-three",
    type: "lottie",
    name: "Legendary Aura 03",
    description: "A vivid legendary animation for a high-impact arrival.",
    tier: "legendary",
    animationData: legendaryAuraThree,
    speed: 1,
    gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
    glow: "rgba(168, 85, 247, 0.58)",
  },
  {
    id: "legendary-aura-four",
    type: "lottie",
    name: "Legendary Aura 04",
    description: "A warm legendary flare designed for a bold entrance.",
    tier: "legendary",
    animationData: legendaryAuraFour,
    speed: 1,
    gradient: "linear-gradient(135deg, #fb7185, #ea580c)",
    glow: "rgba(251, 113, 133, 0.56)",
  },
  {
    id: "legendary-aura-five",
    type: "lottie",
    name: "Legendary Aura 05",
    description: "A refined legendary reveal with a luminous green finish.",
    tier: "legendary",
    animationData: legendaryAuraFive,
    speed: 1,
    gradient: "linear-gradient(135deg, #34d399, #0f766e)",
    glow: "rgba(52, 211, 153, 0.56)",
  },
  {
    id: "legendary-aura-six",
    type: "lottie",
    name: "Legendary Aura 06",
    description: "A dramatic legendary sequence with an intense glow.",
    tier: "legendary",
    animationData: legendaryAuraSix,
    speed: 1,
    gradient: "linear-gradient(135deg, #facc15, #7c3aed)",
    glow: "rgba(250, 204, 21, 0.58)",
  },
  {
    id: "legendary-aura-seven",
    type: "lottie",
    name: "Legendary Aura 07",
    description: "A signature legendary entrance with a cosmic finish.",
    tier: "legendary",
    animationData: legendaryAuraSeven,
    speed: 1,
    gradient: "linear-gradient(135deg, #60a5fa, #7c3aed)",
    glow: "rgba(96, 165, 250, 0.58)",
  },
  {
    id: "legendary-aura-eight",
    type: "lottie",
    name: "Legendary Aura 08",
    description: "A vivid legendary entrance with a brilliant neon pulse.",
    tier: "legendary",
    animationData: legendaryAuraEight,
    speed: 1,
    gradient: "linear-gradient(135deg, #2dd4bf, #2563eb)",
    glow: "rgba(45, 212, 191, 0.58)",
  },
  {
    id: "legendary-aura-nine",
    type: "lottie",
    name: "Legendary Aura 09",
    description: "A powerful legendary reveal with a deep cosmic shine.",
    tier: "legendary",
    animationData: legendaryAuraNine,
    speed: 1,
    gradient: "linear-gradient(135deg, #c084fc, #db2777)",
    glow: "rgba(192, 132, 252, 0.6)",
  },
  {
    id: "legendary-aura-ten",
    type: "lottie",
    name: "Legendary Aura 10",
    description: "A rare legendary finale with a warm radiant flare.",
    tier: "legendary",
    animationData: legendaryAuraTen,
    speed: 1,
    gradient: "linear-gradient(135deg, #fde047, #f97316)",
    glow: "rgba(253, 224, 71, 0.6)",
  },
];

export function getEntryAnimation(animationId) {
  return (
    ENTRY_ANIMATIONS.find((animation) => animation.id === animationId) ||
    ENTRY_ANIMATIONS[0]
  );
}
