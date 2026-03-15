'use client'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/game/GameState'

interface RepCounterInput {
  repCount: number
  formScore: number
}

export function useRepCounter({ repCount, formScore }: RepCounterInput) {
  const incrementRep  = useGameStore(s => s.incrementRep)
  const setFormScore  = useGameStore(s => s.setFormScore)
  const setBoost      = useGameStore(s => s.setBoost)
  const isStarted     = useGameStore(s => s.isStarted)
  const prevRepRef    = useRef(0)
  const boostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync form score every update
  useEffect(() => {
    setFormScore(formScore)
  }, [formScore, setFormScore])

  // Fire incrementRep ONCE per new rep
  useEffect(() => {
    if (!isStarted) {
      // Keep tracking pose server rep count but don't increment game
      prevRepRef.current = repCount
      return
    }

    if (repCount > prevRepRef.current) {
      const diff = repCount - prevRepRef.current
      for (let i = 0; i < diff; i++) {
        incrementRep()
      }

      // Boost intensity based on form score
      const boostIntensity = formScore >= 80 ? 1.0 : formScore >= 50 ? 0.6 : 0.2
      setBoost(true, boostIntensity)

      if (boostTimerRef.current) clearTimeout(boostTimerRef.current)
      boostTimerRef.current = setTimeout(() => setBoost(false, 0), 800)

      console.log(`[RepCounter] +${diff} rep(s) → game total: ${useGameStore.getState().repCount}`)
    }
    prevRepRef.current = repCount
  }, [repCount, formScore, incrementRep, setBoost, isStarted])

  useEffect(() => {
    return () => {
      if (boostTimerRef.current) clearTimeout(boostTimerRef.current)
    }
  }, [])
}
