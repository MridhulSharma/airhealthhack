import { create } from "zustand";

type Theme = "f1" | "pirate";
type ExerciseType = "pushup" | "squat";

interface GameState {
  // Theme
  selectedTheme: Theme | null;
  setTheme: (theme: Theme) => void;

  // Workout config
  targetReps: number;
  exerciseType: ExerciseType;

  // Live workout state
  repCount: number;
  formScore: number;
  progress: number;
  speed: number;
  isStarted: boolean;
  isFinished: boolean;

  // Lap tracking
  lapCount: number;
  currentLapTime: number;
  bestLapTime: number | null;

  // Boost
  boostActive: boolean;
  boostIntensity: number;

  // Actions
  incrementRep: () => void;
  setFormScore: (score: number) => void;
  startWorkout: () => void;
  resetWorkout: () => void;
  setLapCount: (lap: number) => void;
  setCurrentLapTime: (time: number) => void;
  completeLap: () => void;
  setBoost: (active: boolean, intensity?: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedTheme: null,
  setTheme: (theme) => set({ selectedTheme: theme }),

  targetReps: 15,
  exerciseType: "pushup",

  repCount: 0,
  formScore: 100,
  progress: 0,
  speed: 1,
  isStarted: false,
  isFinished: false,

  lapCount: 1,
  currentLapTime: 0,
  bestLapTime: null,

  boostActive: false,
  boostIntensity: 0,

  incrementRep: () =>
    set((state) => {
      const repCount = state.repCount + 1;
      const progress = repCount / state.targetReps;
      const speed = 1 + progress * 5;
      const isFinished = repCount >= state.targetReps;
      return { repCount, progress, speed, isFinished };
    }),

  setFormScore: (score) => set({ formScore: score }),

  startWorkout: () => set({ isStarted: true }),

  resetWorkout: () =>
    set({
      repCount: 0,
      formScore: 100,
      progress: 0,
      speed: 1,
      isStarted: false,
      isFinished: false,
      lapCount: 1,
      currentLapTime: 0,
      bestLapTime: null,
      boostActive: false,
      boostIntensity: 0,
    }),

  setLapCount: (lap) => set({ lapCount: lap }),

  setCurrentLapTime: (time) => set({ currentLapTime: time }),

  completeLap: () =>
    set((state) => {
      const best =
        state.bestLapTime === null
          ? state.currentLapTime
          : Math.min(state.bestLapTime, state.currentLapTime);
      return {
        lapCount: state.lapCount + 1,
        bestLapTime: best,
        currentLapTime: 0,
      };
    }),

  setBoost: (active, intensity) =>
    set({
      boostActive: active,
      boostIntensity: intensity ?? (active ? 1 : 0),
    }),
}));