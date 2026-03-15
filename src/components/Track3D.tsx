"use client";

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const TRACK_URL = "/models/track/scene.gltf";

export default function Track3D() {
  const { scene } = useGLTF(TRACK_URL);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      {/* SCALE_CALIBRATION: adjust scale after first render */}
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

useGLTF.preload(TRACK_URL);
