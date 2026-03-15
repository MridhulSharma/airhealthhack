"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useGameStore } from "@/game/GameState";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { useRepCounter } from "@/hooks/useRepCounter";
import WorkoutUI from "@/components/WorkoutUI";
import RepFeedback from "@/components/RepFeedback";

// Dynamic import — Scene3D uses Three.js which must not SSR
const Scene3D = dynamic(
  () => import("@/components/Scene3D").then((mod) => mod.Scene3D),
  { ssr: false }
);

function repStateDotColor(state: string) {
  if (state === "up") return "bg-green-500";
  if (state === "down") return "bg-red-500";
  return "bg-gray-500";
}

export default function WorkoutPage() {
  const router = useRouter();
  const selectedTheme = useGameStore((s) => s.selectedTheme);
  const isStarted = useGameStore((s) => s.isStarted);
  const startWorkout = useGameStore((s) => s.startWorkout);

  const {
    repCount,
    formScore,
    isConnected,
    error,
    elbowAngle,
    elbowAngleL,
    elbowAngleR,
    repState,
    isMockMode,
    calibrating,
    calibReps,
    fatigueIssues,
  } = usePoseDetection();
  useRepCounter({ repCount, formScore });

  // Loading state — simulates init before showing START overlay
  const [loadingStage, setLoadingStage] = useState<
    "camera" | "pose" | "ready"
  >("camera");

  useEffect(() => {
    const t1 = setTimeout(() => setLoadingStage("pose"), 800);
    const t2 = setTimeout(() => setLoadingStage("ready"), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Redirect to theme select if no theme chosen
  useEffect(() => {
    if (!selectedTheme) {
      router.push("/select");
    }
  }, [selectedTheme, router]);

  // ── Auto-launch pose server on mount ────────────────────────────────────
  useEffect(() => {
    fetch('/api/start-pose-server', { method: 'POST' })
      .then(r => r.json())
      .then(d => console.log('Pose server:', d.status))
      .catch(e => console.log('Pose server launch failed (may already be running):', e))
  }, []);

  // ── MJPEG stream auto-retry ─────────────────────────────────────────────
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const retry = setInterval(() => {
      if (imgRef.current) {
        // Force reload the stream src to retry connection
        const src = imgRef.current.src
        imgRef.current.src = ''
        imgRef.current.src = src
      }
    }, 3000) // retry every 3s until stream connects
    return () => clearInterval(retry)
  }, []);

  if (!selectedTheme) return null;

  // Loading screen
  if (loadingStage !== "ready") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-lg text-gray-400">
          {loadingStage === "camera"
            ? "Initializing camera..."
            : "Loading pose detection..."}
        </p>
      </div>
    );
  }

  const isF1 = selectedTheme === "f1";
  const themeName = isF1 ? "F1 Race 🏎️" : "Pirate Ship 🏴‍☠️";
  const buttonLabel = isF1 ? "Begin Race 🏎️" : "Set Sail 🏴‍☠️";

  return (
    <div className="h-screen w-screen overflow-hidden bg-black m-0 p-0">
      {/* z-0: Three.js game scene */}
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>

      {/* z-10: Workout UI overlay */}
      <WorkoutUI
        calibrating={calibrating}
        calibReps={calibReps}
        fatigueIssues={fatigueIssues}
      />

      {/* z-20: Rep feedback overlay */}
      <RepFeedback />

      {/* ── Connection / error banner ────────────────────────────────────── */}
      {error ? (
        <div className="fixed top-0 left-0 z-30 w-full bg-red-600 py-2 text-center text-sm font-semibold text-white">
          {error}
        </div>
      ) : (
        !isConnected && (
          <div className="fixed top-0 left-0 z-30 w-full bg-yellow-500 py-2 text-center text-sm font-semibold text-black">
            ⚠ Waiting for pose server... Run: python pose_server.py
          </div>
        )
      )}

      {/* ── Mock mode indicator ────────────────────────────────────────── */}
      {isMockMode && isStarted && (
        <div className="fixed top-0 left-0 z-30 w-full bg-blue-600/80 py-1.5 text-center text-xs font-semibold text-white">
          Demo Mode — simulated reps (pose server not detected)
        </div>
      )}

      {/* ── START overlay ────────────────────────────────────────────────── */}
      {!isStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <h1 className="mb-2 text-5xl font-bold text-white">{themeName}</h1>

          <div className="mb-8 flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-sm text-gray-400">
              {isConnected
                ? isMockMode
                  ? "Demo mode (simulated data)"
                  : "Pose server connected"
                : "Connecting to pose server..."}
            </span>
          </div>

          <motion.button
            whileHover={isConnected ? { scale: 1.05 } : {}}
            whileTap={isConnected ? { scale: 0.95 } : {}}
            onClick={() => isConnected && startWorkout()}
            disabled={!isConnected}
            className={`rounded-full px-10 py-4 text-xl font-bold transition-colors ${
              isConnected
                ? "bg-white text-black cursor-pointer hover:bg-gray-200"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {buttonLabel}
          </motion.button>
        </motion.div>
      )}

      {/* Live pose camera feed — MJPEG stream from pose_server.py */}
      <div className="fixed bottom-4 left-4 z-20 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs text-white">LIVE</span>
          {calibrating && (
            <span className="font-mono text-xs text-blue-300">
              · calibrating {calibReps}/2
            </span>
          )}
        </div>
        <div className="relative rounded-xl overflow-hidden border border-white/20"
             style={{ width: 308, height: 231 }}>
          <img
            ref={imgRef}
            src="http://localhost:8766/video"
            alt="Live pose feed"
            className="w-full h-full object-cover"
            onError={(e) => {
              // If stream not ready, show placeholder
              (e.target as HTMLImageElement).style.opacity = '0.3'
            }}
          />
          {/* Fatigue warnings overlaid on camera feed */}
          {fatigueIssues.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-1 flex flex-col gap-0.5">
              {fatigueIssues.slice(0, 2).map((issue, i) => (
                <div key={i} className="bg-red-900/80 rounded px-2 py-0.5 font-mono text-xs text-red-300 text-center">
                  ⚠️ {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom-right HUD ─────────────────────────────────────────────── */}
      {isStarted && (
        <div className="fixed bottom-4 right-4 z-10 flex items-center gap-3 rounded-xl backdrop-blur-md bg-black/40 border border-white/10 px-4 py-2">
          <span className="text-sm text-gray-400">
            Elbow:{" "}
            <span className="font-mono text-white">
              {Math.round(elbowAngle)}°
            </span>
          </span>
          <div
            className={`h-2.5 w-2.5 rounded-full ${repStateDotColor(repState)}`}
          />
        </div>
      )}
    </div>
  );
}
