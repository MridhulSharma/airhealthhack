// Bridges pose detection data into Zustand store.
// On each rep: increments store, calculates boost intensity from form score,
// dispatches 800ms boost window.

import { useEffect, useRef } from "react";
import { useGameStore } from "@/game/GameState";

interface RepData {
  repCount: number;
  formScore: number;
}

function boostFromForm(score: number): number {
  if (score > 80) return 1.0;
  if (score >= 50) return 0.6;
  return 0.2;
}

export function useRepCounter({ repCount, formScore }: RepData) {
  const incrementRep = useGameStore((s) => s.incrementRep);
  const setFormScore = useGameStore((s) => s.setFormScore);
  const setBoost = useGameStore((s) => s.setBoost);
  const storeCount = useGameStore((s) => s.repCount);
  const isStarted = useGameStore((s) => s.isStarted);

  const boostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repOffsetRef = useRef<number | null>(null);

  // When workout starts, snapshot the current WebSocket repCount as offset
  // so only NEW reps after this point count toward the game.
  useEffect(() => {
    if (isStarted) {
      repOffsetRef.current = null; // will be set on next repCount change
    }
  }, [isStarted]);

  useEffect(() => {
    // Capture offset on the first rep update after workout starts
    if (repOffsetRef.current === null) {
      repOffsetRef.current = repCount;
      return;
    }

    const adjustedReps = repCount - repOffsetRef.current;
    if (adjustedReps > storeCount) {
      incrementRep();

      // Trigger boost
      const intensity = boostFromForm(formScore);
      setBoost(true, intensity);

      if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
      boostTimerRef.current = setTimeout(() => {
        setBoost(false, 0);
      }, 800);
    }
  }, [repCount, storeCount, incrementRep, setBoost, formScore]);

  useEffect(() => {
    setFormScore(formScore);
  }, [formScore, setFormScore]);

  useEffect(() => {
    return () => {
      if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
    };
  }, []);

  return { repCount, formScore };
}
