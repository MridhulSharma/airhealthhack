"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Track3D from "./Track3D";
import Car3D from "./Car3D";
import CameraRig from "./CameraRig";
import { PostProcessing } from "./PostProcessing";
import { raceEngine } from "@/game/RaceEngine";
import { useGameStore } from "@/game/GameState";

// Inner component — runs inside Canvas context
function GameLoop() {
  const speed = useGameStore((s) => s.speed);
  const boostActive = useGameStore((s) => s.boostActive);
  const isStarted = useGameStore((s) => s.isStarted);
  const completeLap = useGameStore((s) => s.completeLap);

  const tRef = useRef(0);
  const positionRef = useRef(new THREE.Vector3());
  const quaternionRef = useRef(new THREE.Quaternion());
  const lateralForceRef = useRef(0);
  const prevTangentRef = useRef(new THREE.Vector3());
  const checkpointsPassed = useRef<number[]>([]);
  const lastCheckpointIndex = useRef(-1);
  const carGroupRef = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (!isStarted) return;

    // Advance car along spline
    const speedFactor = speed * 0.00035 + (boostActive ? 0.0006 : 0);
    tRef.current = (tRef.current + speedFactor) % 1;

    const pos = raceEngine.getTrackPosition(tRef.current);
    const tangent = raceEngine.getTrackTangent(tRef.current);

    // Y_OFFSET_CALIBRATION: adjust the +Y offset below after first render to sit car on track surface
    positionRef.current.set(pos.x, pos.y + 1.2, pos.z);

    // Build quaternion from tangent
    const up = new THREE.Vector3(0, 1, 0);
    const lookTarget = positionRef.current.clone().add(tangent);
    const matrix = new THREE.Matrix4().lookAt(
      positionRef.current,
      lookTarget,
      up
    );
    quaternionRef.current.setFromRotationMatrix(matrix);

    // Lateral force from tangent change
    const tangentDelta = tangent.x - prevTangentRef.current.x;
    lateralForceRef.current = THREE.MathUtils.lerp(
      lateralForceRef.current,
      tangentDelta * 40,
      0.15
    );
    prevTangentRef.current.copy(tangent);

    // Checkpoint detection
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
      <PostProcessing boostActive={boostActive} />
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

export function Scene3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 65, near: 0.1, far: 3000 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <RendererSetup />
      <fog attach="fog" args={["#0a0f1a", 200, 1200]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[200, 300, 100]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      <Environment preset="night" />
      <Stars radius={800} depth={80} count={5000} factor={5} />
      <GameLoop />
    </Canvas>
  );
}
