"use client";

import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, MathUtils } from "three";

interface Props {
  boostActive: boolean;
}

export function PostProcessing({ boostActive }: Props) {
  const aberrationOffset = useRef(new Vector2(0.0005, 0.0005));

  useFrame(() => {
    const target = boostActive ? 0.004 : 0.0005;
    aberrationOffset.current.x = MathUtils.lerp(
      aberrationOffset.current.x,
      target,
      0.1
    );
    aberrationOffset.current.y = MathUtils.lerp(
      aberrationOffset.current.y,
      target,
      0.1
    );
  });

  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.3} intensity={1.4} mipmapBlur />
      <ChromaticAberration offset={aberrationOffset.current} />
      <Vignette eskil={false} offset={0.3} darkness={0.7} />
      <ToneMapping />
    </EffectComposer>
  );
}
