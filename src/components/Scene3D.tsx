"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState, Component, type ReactNode } from "react";
import * as THREE from "three";
import Track3D from "./Track3D";
import Car3D from "./Car3D";
import CameraRig from "./CameraRig";
import { raceEngine } from "@/game/RaceEngine";
import { useGameStore } from "@/game/GameState";

function GameLoop() {
  const speed = useGameStore((s) => s.speed);
  const boostActive = useGameStore((s) => s.boostActive);
  const isStarted = useGameStore((s) => s.isStarted);
  const isFinished = useGameStore((s) => s.isFinished);
  const completeLap = useGameStore((s) => s.completeLap);

  const tRef = useRef(0);
  const positionRef = useRef(new THREE.Vector3());
  const quaternionRef = useRef(new THREE.Quaternion());
  const lateralForceRef = useRef(0);
  const prevTangentRef = useRef(new THREE.Vector3());
  const checkpointsPassed = useRef<number[]>([]);
  const lastCheckpointIndex = useRef(-1);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const boostLightRef = useRef<THREE.PointLight>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const downVec = useRef(new THREE.Vector3(0, -1, 0));
  const smoothedY = useRef<number | null>(null);
  const smoothedQuat = useRef(new THREE.Quaternion());
  const quatInitialized = useRef(false);

  // Pre-allocated objects to avoid per-frame GC pressure
  const _rayOrigin = useRef(new THREE.Vector3());
  const _lookTarget = useRef(new THREE.Vector3());
  const _rotMatrix = useRef(new THREE.Matrix4());
  const _targetQuat = useRef(new THREE.Quaternion());
  const _flip = useRef(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
  );
  const _upVec = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    if (!isStarted) return;

    // Stop car movement when finished
    if (isFinished) return;

    // Boost light effect
    if (boostLightRef.current) {
      boostLightRef.current.intensity = THREE.MathUtils.lerp(
        boostLightRef.current.intensity,
        boostActive ? 8 : 0,
        0.15
      );
    }

    // Advance car along spline
    const speedFactor = speed * 0.00018 + (boostActive ? 0.00038 : 0);
    tRef.current = ((tRef.current + speedFactor) % 1 + 1) % 1;

    const pos = raceEngine.getTrackPosition(tRef.current);
    const lookAheadT = ((tRef.current + 0.005) % 1 + 1) % 1;
    const lookAheadPos = raceEngine.getTrackPosition(lookAheadT);

    // Raycast downward onto the road mesh for exact surface Y
    const roadMeshes = (window as any).__roadMeshes as
      | THREE.Mesh[]
      | undefined;

    let surfaceY = pos.y + 1.8; // safe fallback

    if (roadMeshes && roadMeshes.length > 0) {
      _rayOrigin.current.set(pos.x, pos.y + 80, pos.z);
      raycaster.current.set(_rayOrigin.current, downVec.current);
      const hits = raycaster.current.intersectObjects(roadMeshes, false);
      if (hits.length > 0) {
        const rawY = hits[0].point.y + 1.8;
        if (smoothedY.current === null) {
          smoothedY.current = rawY;
        } else {
          smoothedY.current = THREE.MathUtils.lerp(
            smoothedY.current,
            rawY,
            0.2
          );
        }
        surfaceY = smoothedY.current;
      }
    }

    positionRef.current.set(pos.x, surfaceY, pos.z);

    // Car orientation — use look-ahead with slope from driving line
    const slopeY = lookAheadPos.y - pos.y;
    _lookTarget.current.set(lookAheadPos.x, surfaceY + slopeY, lookAheadPos.z);

    _rotMatrix.current.lookAt(positionRef.current, _lookTarget.current, _upVec.current);
    _targetQuat.current.setFromRotationMatrix(_rotMatrix.current);

    // Flip 180° — car faces forward not backward
    _targetQuat.current.multiply(_flip.current);

    // Smooth quaternion to prevent jitter
    if (!quatInitialized.current) {
      smoothedQuat.current.copy(_targetQuat.current);
      quatInitialized.current = true;
    } else {
      smoothedQuat.current.slerp(_targetQuat.current, 0.15);
    }
    quaternionRef.current.copy(smoothedQuat.current);

    // Lateral force for body roll
    const tangent = raceEngine.getTrackTangent(tRef.current);
    const tangentDelta = tangent.x - prevTangentRef.current.x;
    lateralForceRef.current = THREE.MathUtils.lerp(
      lateralForceRef.current,
      tangentDelta * 40,
      0.15
    );
    prevTangentRef.current.copy(tangent);

    // Checkpoint + lap detection
    const cp = raceEngine.checkCheckpoint(pos, lastCheckpointIndex.current);
    if (cp !== null) {
      lastCheckpointIndex.current = cp;
      if (!checkpointsPassed.current.includes(cp)) {
        checkpointsPassed.current.push(cp);
      }
      if (raceEngine.checkLapComplete(checkpointsPassed.current)) {
        completeLap();
        checkpointsPassed.current = [];
        lastCheckpointIndex.current = -1;
      }
    }
  });

  return (
    <>
      <Track3D />
      <Car3D
        positionRef={positionRef}
        quaternionRef={quaternionRef}
        speed={speed}
        boostActive={boostActive}
        lateralForce={lateralForceRef.current}
        groupRef={carGroupRef}
      />
      <CameraRig
        targetRef={carGroupRef}
        speed={speed}
        boostActive={boostActive}
      />
      {/* Boost point light — replaces post-processing bloom */}
      <pointLight
        ref={boostLightRef}
        color="#fbbf24"
        intensity={0}
        distance={30}
        decay={2}
        position={[
          positionRef.current.x,
          positionRef.current.y + 2,
          positionRef.current.z,
        ]}
      />
    </>
  );
}

function RendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
  }, [gl]);
  return null;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

class Scene3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[Scene3D] Failed to load:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black text-white">
          <div className="text-center">
            <p className="text-lg font-semibold">3D scene failed to load</p>
            <p className="mt-2 text-sm text-gray-400">{this.state.error}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: "" });
              }}
              className="mt-4 rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Scene3D() {
  const [mounted, setMounted] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => setMounted(true), []);


  if (!mounted) return null;

  if (contextLost) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">GPU context lost</p>
          <p className="mt-2 text-sm text-gray-400">Waiting for WebGL to recover...</p>
          <button
            onClick={() => setContextLost(false)}
            className="mt-4 rounded-full bg-white/10 px-6 py-2 text-sm hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Scene3DErrorBoundary>
      <Canvas
        ref={canvasRef}
        shadows={false}
        dpr={[1, 1]}
        camera={{ fov: 65, near: 0.1, far: 1500 }}
        style={{ position: "absolute", inset: 0 }}
        gl={{
          powerPreference: "default",
          antialias: false,
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context lost — will attempt recovery");
            setContextLost(true);
          });
          gl.domElement.addEventListener("webglcontextrestored", () => {
            console.log("WebGL context restored");
            setContextLost(false);
          });
        }}
      >
        <RendererSetup />
        <fog attach="fog" args={["#0a0f1a", 200, 1200]} />
        <ambientLight intensity={0.5} />
        <directionalLight intensity={1.5} position={[200, 300, 100]} />
        <Environment preset="night" />
        <Stars radius={800} depth={80} count={3000} factor={5} />
        <Suspense fallback={<LoadingFallback />}>
          <GameLoop />
        </Suspense>
      </Canvas>
    </Scene3DErrorBoundary>
  );
}
