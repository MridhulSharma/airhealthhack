"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const CAR_URL = "/models/car/scene.gltf";

interface Car3DProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  quaternionRef: React.MutableRefObject<THREE.Quaternion>;
  speed: number;
  boostActive: boolean;
  lateralForce: number;
  groupRef?: React.MutableRefObject<THREE.Group | null>;
}

export default function Car3D({
  positionRef,
  quaternionRef,
  speed,
  boostActive,
  lateralForce,
  groupRef,
}: Car3DProps) {
  const { scene } = useGLTF(CAR_URL);
  const internalRef = useRef<THREE.Group>(null);
  const carGroupRef = groupRef ?? internalRef;
  const bodyRef = useRef<THREE.Group>(null);

  const wheelRF = useRef<THREE.Object3D | undefined>(undefined);
  const wheelLF = useRef<THREE.Object3D | undefined>(undefined);
  const wheelLR = useRef<THREE.Object3D | undefined>(undefined);
  const wheelRR = useRef<THREE.Object3D | undefined>(undefined);
  const rearlightMat = useRef<THREE.MeshStandardMaterial | undefined>(
    undefined
  );

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;

        // Try to find rearlight material by name
        if (
          child.name.toLowerCase().includes("rear") ||
          child.name.toLowerCase().includes("tail") ||
          child.name.toLowerCase().includes("light")
        ) {
          const mat = child.material;
          if (mat instanceof THREE.MeshStandardMaterial) {
            rearlightMat.current = mat;
          }
        }
      }
    });

    // Find wheel objects by GLTF node names
    wheelRF.current =
      scene.getObjectByName("WHEEL_RF_185") ?? undefined;
    wheelLF.current =
      scene.getObjectByName("WHEEL_LF_297") ?? undefined;
    wheelLR.current =
      scene.getObjectByName("WHEEL_LR_306") ?? undefined;
    wheelRR.current =
      scene.getObjectByName("WHEEL_RR_316") ?? undefined;
  }, [scene]);

  useFrame(() => {
    if (!carGroupRef.current) return;

    // Apply position and quaternion from refs (set by parent game loop)
    carGroupRef.current.position.copy(positionRef.current);
    carGroupRef.current.quaternion.copy(quaternionRef.current);

    // Rotate wheels based on speed
    const wheelSpin = speed * 0.15;
    if (wheelRF.current) wheelRF.current.rotation.x += wheelSpin;
    if (wheelLF.current) wheelLF.current.rotation.x += wheelSpin;
    if (wheelLR.current) wheelLR.current.rotation.x += wheelSpin;
    if (wheelRR.current) wheelRR.current.rotation.x += wheelSpin;

    // Body roll on inner group — avoids conflicting with quaternion on outer group
    if (bodyRef.current) {
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyRef.current.rotation.z,
        lateralForce * -0.015,
        0.08
      );
    }

    // Boost rearlight glow
    if (rearlightMat.current) {
      const targetIntensity = boostActive ? 3 : 0.2;
      rearlightMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        rearlightMat.current.emissiveIntensity,
        targetIntensity,
        0.1
      );
    }
  });

  return (
    <group ref={carGroupRef}>
      <group ref={bodyRef}>
        {/* SCALE_CALIBRATION: adjust scale after first render */}
        <primitive object={scene} scale={[80, 80, 80]} />
      </group>
    </group>
  );
}

useGLTF.preload(CAR_URL);
