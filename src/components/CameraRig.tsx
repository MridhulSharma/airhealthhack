"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraRigProps {
  targetRef: React.MutableRefObject<THREE.Group | null>;
  speed: number;
  boostActive: boolean;
}

export default function CameraRig({
  targetRef,
  speed,
  boostActive,
}: CameraRigProps) {
  const { camera } = useThree();
  const smoothedPos = useRef(new THREE.Vector3());
  const smoothedLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    if (!targetRef.current) return;

    const carPos = new THREE.Vector3();
    targetRef.current.getWorldPosition(carPos);

    // Safety check
    if (carPos.y < -50 || carPos.y > 200) return;

    // Travel direction along the track (direction car is moving)
    const forward = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(targetRef.current.quaternion)
      .normalize();

    // Camera directly on top of the rear of the car: behind and high above
    const idealPos = carPos
      .clone()
      .addScaledVector(forward, -4)
      .add(new THREE.Vector3(0, 6, 0));

    // Look-at: ahead of car at car height
    const idealLookAt = carPos
      .clone()
      .addScaledVector(forward, 10);

    // First frame: snap instantly
    if (!initialized.current) {
      smoothedPos.current.copy(idealPos);
      smoothedLookAt.current.copy(idealLookAt);
      initialized.current = true;
    }

    // Smooth follow
    smoothedPos.current.lerp(idealPos, 0.15);
    smoothedLookAt.current.lerp(idealLookAt, 0.15);

    camera.position.copy(smoothedPos.current);
    camera.lookAt(smoothedLookAt.current);

    // Speed-reactive FOV
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, 65 + speed * 2, 0.05);
      camera.updateProjectionMatrix();
    }

    // Boost shake
    if (boostActive) {
      camera.position.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          0
        )
      );
    }
  });

  return null;
}
