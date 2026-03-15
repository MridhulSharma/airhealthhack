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
  const tempVec = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const idealPos = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!targetRef.current) return;

    // Get car world position
    targetRef.current.getWorldPosition(tempVec.current);

    // Get car forward direction from quaternion
    forward.current.set(0, 0, -1);
    forward.current.applyQuaternion(targetRef.current.quaternion);
    forward.current.normalize();

    // Ideal camera position: behind and above the car
    // carPos - forward * 12 + up * 5
    idealPos.current
      .copy(tempVec.current)
      .sub(forward.current.clone().multiplyScalar(12))
      .add(new THREE.Vector3(0, 5, 0));

    // Smooth follow
    camera.position.lerp(idealPos.current, 0.08);

    // Look-at target: ahead of the car
    const lookAtTarget = tempVec.current
      .clone()
      .add(forward.current.clone().multiplyScalar(8));
    currentLookAt.current.lerp(lookAtTarget, 0.12);
    camera.lookAt(currentLookAt.current);

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
