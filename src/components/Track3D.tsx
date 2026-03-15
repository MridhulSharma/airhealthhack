"use client";

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const TRACK_URL = "/models/track/scene.gltf";

export default function Track3D() {
  const { scene } = useGLTF(TRACK_URL);
  const groupRef = useRef<THREE.Group>(null);

  // Expose scene globally for browser console inspection
  useEffect(() => {
    if (scene) (window as any).__scene = scene;
  }, [scene]);

  // Enable shadows on all meshes
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Collect road meshes for raycasting
  useEffect(() => {
    if (!scene) return;
    const primary: THREE.Mesh[] = [];
    const secondary: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const name = obj.name.toLowerCase();
        if (
          name.includes("tarmac") ||
          name.includes("road") ||
          name.includes("asphalt") ||
          name.includes("track")
        ) {
          primary.push(obj as THREE.Mesh);
        } else if (
          name.includes("white") ||
          name.includes("line") ||
          name.includes("runoff")
        ) {
          secondary.push(obj as THREE.Mesh);
        }
      }
    });
    const meshes = [...primary, ...secondary];
    (window as any).__roadMeshes = meshes;
    console.log(`Road meshes: ${primary.length} primary, ${secondary.length} secondary`);
  }, [scene]);

  return (
    <group ref={groupRef}>
      {/* SCALE_CALIBRATION: adjust scale after first render */}
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

useGLTF.preload(TRACK_URL);