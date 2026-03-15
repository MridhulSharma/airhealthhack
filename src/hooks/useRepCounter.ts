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
  const isStarted = useGameStore((s) => s.isStarted);
  const setFormScore = useGameStore((s) => s.setFormScore);

  const boostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repOffsetRef = useRef<number | null>(null);
  const lastWsCount = useRef<number>(repCount);

  // When workout starts, capture offset so only NEW reps count.
  // When workout is not started, keep resetting offset to current repCount.
  useEffect(() => {
    if (isStarted) {
      // Lock the offset to whatever the WebSocket count is right now
      repOffsetRef.current = repCount;
    } else {
      repOffsetRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  // Only react to WebSocket repCount changes — never to store changes
  useEffect(() => {
    // Don't process reps before workout starts
    if (!isStarted) {
      lastWsCount.current = repCount;
      return;
    }

    // Set offset on first update after start
    if (repOffsetRef.current === null) {
      repOffsetRef.current = repCount;
      lastWsCount.current = repCount;
      return;
    }

    // Only process if the WebSocket count actually increased since last time
    if (repCount <= lastWsCount.current) return;
    lastWsCount.current = repCount;

    // Calculate how many reps since workout started
    const adjustedReps = repCount - repOffsetRef.current;

    // Only increment if adjusted count is ahead of store count
    const storeCount = useGameStore.getState().repCount;
    if (adjustedReps > storeCount) {
      // Increment exactly once
      useGameStore.getState().incrementRep();

      // Trigger boost
      const intensity = boostFromForm(formScore);
      useGameStore.getState().setBoost(true, intensity);

      if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
      boostTimerRef.current = setTimeout(() => {
        useGameStore.getState().setBoost(false, 0);
      }, 800);
    }
    // Only depend on repCount from WebSocket — NOT on store state or actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repCount]);

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
