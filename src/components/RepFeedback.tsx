"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/game/GameState";
import { useSpeech } from "@/hooks/useSpeech";

const GOOD = ["Speed Boost! 🚀", "Perfect Form! ⚡", "Full throttle! 🏁", "Clean rep! ✅"];
const OK   = ["Good rep!", "Keep pushing!", "Stay strong!"];
const BAD  = ["Fix your form ⚠️", "Go deeper!", "Full range!"];

// Speech-friendly versions (no emojis)
const GOOD_SPEECH = ["Speed Boost!", "Perfect Form!", "Full throttle!", "Clean rep!"];
const OK_SPEECH   = ["Good rep!", "Keep pushing!", "Stay strong!"];
const BAD_SPEECH  = ["Fix your form!", "Go deeper!", "Full range!"];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMessage(formScore: number): { display: string; speech: string } {
  if (formScore > 80) {
    const i = Math.floor(Math.random() * GOOD.length);
    return { display: GOOD[i], speech: GOOD_SPEECH[i] };
  }
  if (formScore >= 50) {
    const i = Math.floor(Math.random() * OK.length);
    return { display: OK[i], speech: OK_SPEECH[i] };
  }
  const i = Math.floor(Math.random() * BAD.length);
  return { display: BAD[i], speech: BAD_SPEECH[i] };
}

export default function RepFeedback() {
  const repCount = useGameStore((s) => s.repCount);
  const formScore = useGameStore((s) => s.formScore);
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const { speak } = useSpeech();

  useEffect(() => {
    if (repCount === 0) return;

    const msg = pickMessage(formScore);
    setMessage(msg.display);
    setKey((k) => k + 1);

    // Speak the feedback aloud
    speak(msg.speech, {
      priority: formScore < 50 ? "high" : "normal",
      rate: 1.2,
    });

    const timer = setTimeout(() => setMessage(null), 1200);
    return () => clearTimeout(timer);
  }, [repCount, formScore, speak]);

  return (
    <div className="fixed left-1/2 top-[40%] z-20 -translate-x-1/2 pointer-events-none">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={key}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 1.2 }}
            transition={{ duration: 1.2 }}
            className="whitespace-nowrap text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
