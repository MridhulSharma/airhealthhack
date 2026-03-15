// Real WebSocket hook with mock fallback.
// Connects to ws://localhost:8765 (pose_server.py).
// Falls back to mock mode if connection fails within 3 seconds.
// Return signature: { landmarks, repCount, repState, elbowAngle, formScore, isConnected, error, isMockMode }

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8765";
const MOCK_FALLBACK_MS = 3000;

export function usePoseDetection() {
  const [landmarks, setLandmarks] = useState<number[][]>([]);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(95);
  const [elbowAngle, setElbowAngle] = useState(160);
  const [elbowAngleL, setElbowAngleL] = useState(180);
  const [elbowAngleR, setElbowAngleR] = useState(180);
  const [repState, setRepState] = useState<"idle" | "up" | "down">("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibReps, setCalibReps] = useState(0);
  const [fatigueIssues, setFatigueIssues] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mock mode ─────────────────────────────────────────────────────────
  const startMock = useCallback(() => {
    if (!mountedRef.current) return;
    setIsMockMode(true);
    setIsConnected(true);
    setError(null);

    mockTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setRepCount((prev) => prev + 1);
      setFormScore(Math.floor(Math.random() * 30) + 70);
      setElbowAngle(Math.floor(Math.random() * 80) + 80);
      setRepState((prev) => (prev === "up" ? "down" : "up"));
    }, 3000);
  }, []);

  // ── WebSocket connection ──────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current || isMockMode) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        // Cancel mock fallback — real connection succeeded
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          setLandmarks(data.landmarks ?? []);
          setRepCount(data.repCount);
          setRepState(data.repState);
          setElbowAngle(data.elbowAngle);
          setElbowAngleL(data.elbowAngleL ?? 180);
          setElbowAngleR(data.elbowAngleR ?? 180);
          setFormScore(data.formScore);
          setCalibrating(data.calibrating ?? false);
          setCalibReps(data.calibReps ?? 0);
          setFatigueIssues(data.fatigueIssues ?? []);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket constructor failed
      setIsConnected(false);
    }
  }, [isMockMode]);

  useEffect(() => {
    mountedRef.current = true;

    // Try real WebSocket first
    connect();

    // If not connected within 3 seconds, fall back to mock
    fallbackTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        wsRef.current?.close();
        startMock();
      }
    }, MOCK_FALLBACK_MS);

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [connect, startMock]);

  // Send a reset command to Python pose server
  const resetCounter = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: "reset" }));
    }
    setRepCount(0);
  }, []);

  return {
    landmarks,
    repCount,
    repState,
    elbowAngle,
    elbowAngleL,
    elbowAngleR,
    formScore,
    isConnected,
    error,
    isMockMode,
    calibrating,
    calibReps,
    fatigueIssues,
    resetCounter,
  };
}
