"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/game/GameState";

// ── Helpers ─────────────────────────────────────────────────────────────────
const HUD =
  "backdrop-blur-md bg-black/40 border border-white/10 rounded-xl";

function formBadgeColor(score: number) {
  if (score > 80) return "bg-green-500/80";
  if (score >= 50) return "bg-yellow-500/80";
  return "bg-red-500/80";
}

function progressBarColor(progress: number) {
  if (progress < 0.4) return "#22c55e";
  if (progress < 0.75) return "#eab308";
  return "#ef4444";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function WorkoutUI() {
  const router = useRouter();
  const repCount = useGameStore((s) => s.repCount);
  const targetReps = useGameStore((s) => s.targetReps);
  const progress = useGameStore((s) => s.progress);
  const speed = useGameStore((s) => s.speed);
  const formScore = useGameStore((s) => s.formScore);
  const isFinished = useGameStore((s) => s.isFinished);
  const isStarted = useGameStore((s) => s.isStarted);
  const resetWorkout = useGameStore((s) => s.resetWorkout);
  const lapCount = useGameStore((s) => s.lapCount);
  const currentLapTime = useGameStore((s) => s.currentLapTime);
  const bestLapTime = useGameStore((s) => s.bestLapTime);
  const boostActive = useGameStore((s) => s.boostActive);
  const boostIntensity = useGameStore((s) => s.boostIntensity);
  const setCurrentLapTime = useGameStore((s) => s.setCurrentLapTime);

  const pct = Math.min(Math.round(progress * 100), 100);

  // ── Lap timer ───────────────────────────────────────────────────────────
  const lapStart = useRef(Date.now());

  useEffect(() => {
    if (!isStarted || isFinished) return;
    lapStart.current = Date.now();
    const tick = setInterval(() => {
      setCurrentLapTime((Date.now() - lapStart.current) / 1000);
    }, 100);
    return () => clearInterval(tick);
  }, [isStarted, isFinished, lapCount, setCurrentLapTime]);

  // ── Speed boost flash ─────────────────────────────────────────────────
  const [showFlash, setShowFlash] = useState(false);
  const prevSpeedTier = useRef(Math.floor(speed));

  useEffect(() => {
    const tier = Math.floor(speed);
    if (tier > prevSpeedTier.current && tier >= 2) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 400);
      prevSpeedTier.current = tier;
      return () => clearTimeout(timer);
    }
    prevSpeedTier.current = tier;
  }, [speed]);

  const handleRaceAgain = () => {
    resetWorkout();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* ── TOP LEFT: rep counter + form badge ──────────────────────────── */}
      <div className={`absolute top-5 left-5 ${HUD} px-5 py-4`}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Pushups
        </span>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-mono text-4xl font-bold text-white">
            {repCount}
          </span>
          <span className="font-mono text-xl text-gray-500">
            / {targetReps}
          </span>
        </div>
        <div
          className={`mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${formBadgeColor(formScore)}`}
        >
          FORM: <span className="font-mono ml-1">{formScore}%</span>
        </div>
      </div>

      {/* ── TOP RIGHT: speed + lap times ───────────────────────────────── */}
      <div className={`absolute top-5 right-5 ${HUD} px-5 py-4 min-w-[160px]`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Speed
          </span>
          <span className="text-lg">🏁</span>
        </div>
        <span className="font-mono text-2xl font-bold text-white">
          {speed.toFixed(1)}x
        </span>

        <div className="mt-3 border-t border-white/10 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Lap Time
          </span>
          <p className="font-mono text-lg text-white">
            {formatTime(currentLapTime)}
          </p>
        </div>

        {bestLapTime !== null && (
          <div className="mt-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Best
            </span>
            <p className="font-mono text-sm text-green-400">
              {formatTime(bestLapTime)}
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM: lap counter + progress bar ─────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 w-[85%] max-w-2xl -translate-x-1/2">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-white/70">
              LAP {lapCount} / 3
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Lap Progress
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-gray-400">
            {pct}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 border border-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressBarColor(progress) }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        {/* ── Boost bar ────────────────────────────────────────────────── */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: boostActive ? `${boostIntensity * 100}%` : "0%",
              backgroundColor: boostActive
                ? boostIntensity > 0.8
                  ? "#fbbf24"
                  : "#ffffff"
                : "#ffffff",
            }}
            transition={{ duration: boostActive ? 0.1 : 0.8 }}
            style={{
              boxShadow: boostActive
                ? `0 0 12px ${boostIntensity > 0.8 ? "#fbbf24" : "#ffffff"}80`
                : "none",
            }}
          />
        </div>
      </div>

      {/* ── Speed boost flash ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 120px 40px rgba(255,255,255,0.3)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── FINISH overlay ────────────────────────────────────────────── */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 pointer-events-auto"
        >
          <span className="mb-4 text-8xl">🏆</span>
          <h1 className="mb-2 text-5xl font-bold text-white">
            RACE COMPLETE!
          </h1>
          <p className="mb-2 font-mono text-lg text-gray-400">
            {repCount} pushups completed
          </p>
          {bestLapTime !== null && (
            <p className="mb-6 font-mono text-sm text-green-400">
              Best lap: {formatTime(bestLapTime)}
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRaceAgain}
            className="cursor-pointer rounded-full bg-white px-8 py-3 text-lg font-bold text-black transition-colors hover:bg-gray-200"
          >
            Race Again
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
