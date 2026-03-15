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

  // Collect road meshes and log bounding boxes
  useEffect(() => {
    if (!scene) return;
    const meshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const name = obj.name.toLowerCase();
        if (
          name.includes("tarmac") ||
          name.includes("road") ||
          name.includes("asphalt") ||
          name.includes("track") ||
          name.includes("white") ||
          name.includes("line") ||
          name.includes("runoff")
        ) {
          meshes.push(obj as THREE.Mesh);
          const box = new THREE.Box3().setFromObject(obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          console.log(
            `ROAD MESH: ${obj.name} | Y center: ${center.y.toFixed(3)} | Y min: ${box.min.y.toFixed(3)} | Y max: ${box.max.y.toFixed(3)} | X range: [${box.min.x.toFixed(2)}, ${box.max.x.toFixed(2)}] | Z range: [${box.min.z.toFixed(2)}, ${box.max.z.toFixed(2)}]`
          );
        }
      }
    });
    (window as any).__roadMeshes = meshes;
    console.log("Road meshes collected:", meshes.length);
  }, [scene]);

  return (
    <group ref={groupRef}>
      {/* SCALE_CALIBRATION: adjust scale after first render */}
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

useGLTF.preload(TRACK_URL);