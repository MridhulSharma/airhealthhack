'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = 'ws://localhost:8765'
const MOCK_INTERVAL = 3000
const CONNECT_TIMEOUT = 4000
const RETRY_INTERVAL = 5000

export interface PoseData {
  landmarks: any[]
  repCount: number
  repState: string
  elbowAngle: number
  elbowAngleL: number
  elbowAngleR: number
  formScore: number
  isConnected: boolean
  isMockMode: boolean
  error: string | null
  calibrating: boolean
  calibReps: number
  fatigueIssues: string[]
}

const defaultState: PoseData = {
  landmarks: [],
  repCount: 0,
  repState: 'idle',
  elbowAngle: 180,
  elbowAngleL: 180,
  elbowAngleR: 180,
  formScore: 100,
  isConnected: false,
  isMockMode: false,
  error: null,
  calibrating: false,
  calibReps: 0,
  fatigueIssues: [],
}

export function usePoseDetection(): PoseData {
  const [data, setData] = useState<PoseData>(defaultState)
  const wsRef = useRef<WebSocket | null>(null)
  const mockRef = useRef<NodeJS.Timeout | null>(null)
  const retryRef = useRef<NodeJS.Timeout | null>(null)
  const mockRepCount = useRef(0)
  const isMockRef = useRef(false)

  const startMock = useCallback(() => {
    if (isMockRef.current) return
    isMockRef.current = true
    console.log('[usePoseDetection] Starting mock mode')
    setData(d => ({ ...d, isMockMode: true, isConnected: true, error: null }))

    mockRef.current = setInterval(() => {
      mockRepCount.current += 1
      const formScore = 70 + Math.floor(Math.random() * 30)
      const elbowAngle = 80 + Math.floor(Math.random() * 80)
      setData(d => ({
        ...d,
        repCount: mockRepCount.current,
        formScore,
        elbowAngle,
        elbowAngleL: elbowAngle - 5,
        elbowAngleR: elbowAngle + 5,
        repState: mockRepCount.current % 2 === 0 ? 'up' : 'down',
        isMockMode: true,
        isConnected: true,
      }))
    }, MOCK_INTERVAL)
  }, [])

  const stopMock = useCallback(() => {
    isMockRef.current = false
    if (mockRef.current) clearInterval(mockRef.current)
    mockRef.current = null
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          startMock()
        }
      }, CONNECT_TIMEOUT)

      ws.onopen = () => {
        clearTimeout(timeout)
        stopMock()
        isMockRef.current = false
        console.log('[usePoseDetection] Connected to pose server')
        setData(d => ({ ...d, isConnected: true, isMockMode: false, error: null }))
      }

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          setData({
            landmarks:    payload.landmarks    ?? [],
            repCount:     payload.repCount     ?? 0,
            repState:     payload.repState     ?? 'idle',
            elbowAngle:   payload.elbowAngle   ?? 180,
            elbowAngleL:  payload.elbowAngleL  ?? 180,
            elbowAngleR:  payload.elbowAngleR  ?? 180,
            formScore:    payload.formScore    ?? 100,
            isConnected:  true,
            isMockMode:   false,
            error:        null,
            calibrating:  payload.calibrating  ?? false,
            calibReps:    payload.calibReps    ?? 0,
            fatigueIssues: payload.fatigueIssues ?? [],
          })
        } catch (err) {
          console.error('[usePoseDetection] Parse error:', err)
        }
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        setData(d => ({ ...d, isConnected: false, error: 'Connection failed' }))
      }

      ws.onclose = () => {
        clearTimeout(timeout)
        setData(d => ({ ...d, isConnected: false }))
        if (!isMockRef.current) {
          retryRef.current = setTimeout(connect, RETRY_INTERVAL)
        }
      }
    } catch {
      startMock()
    }
  }, [startMock, stopMock])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      stopMock()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect, stopMock])

  return data
}
