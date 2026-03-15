"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
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

  useFrame(() => {
    if (!isStarted) return;

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
    tRef.current = (tRef.current + speedFactor) % 1;

    const pos = raceEngine.getTrackPosition(tRef.current);
    const lookAheadPos = raceEngine.getTrackPosition(
      (tRef.current + 0.008) % 1
    );

    // Raycast downward onto the road mesh for exact surface Y
    const roadMeshes = (window as any).__roadMeshes as
      | THREE.Mesh[]
      | undefined;

    let surfaceY = pos.y + 1.8; // safe fallback

    if (roadMeshes && roadMeshes.length > 0) {
      raycaster.current.set(
        new THREE.Vector3(pos.x, pos.y + 60, pos.z),
        downVec.current
      );
      const hits = raycaster.current.intersectObjects(roadMeshes, false);
      if (hits.length > 0) {
        const rawY = hits[0].point.y + 1.8;
        if (smoothedY.current === null) {
          smoothedY.current = rawY;
        } else {
          smoothedY.current = THREE.MathUtils.lerp(
            smoothedY.current,
            rawY,
            0.25
          );
        }
        surfaceY = smoothedY.current;
      }
    }

    positionRef.current.set(pos.x, surfaceY, pos.z);

    // Car orientation — faces direction of travel including slope
    const lookAheadWithY = new THREE.Vector3(
      lookAheadPos.x,
      surfaceY + (lookAheadPos.y - pos.y),
      lookAheadPos.z
    );

    const rotMatrix = new THREE.Matrix4().lookAt(
      positionRef.current,
      lookAheadWithY,
      new THREE.Vector3(0, 1, 0)
    );
    quaternionRef.current.setFromRotationMatrix(rotMatrix);

    // Flip 180° — car faces forward not backward
    const flip = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI
    );
    quaternionRef.current.multiply(flip);

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

export function Scene3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
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
        shadow-mapSize={[1024, 1024]}
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
