import * as THREE from "three";
import { buildDrivingLineVectors } from "./drivingLine";

const DRIVING_LINE_POINTS = buildDrivingLineVectors();

export class RaceEngine {
  private curve: THREE.CatmullRomCurve3;
  private readonly NUM_CHECKPOINTS = 20;
  private checkpoints: THREE.Vector3[];
  private sampledPoints: THREE.Vector3[];
  private readonly NUM_SAMPLES = 2000;

  constructor() {
    this.curve = new THREE.CatmullRomCurve3(
      DRIVING_LINE_POINTS,
      true,          // closed loop
      "catmullrom",
      0.5
    );

    // Dense resampling for stable motion
    this.sampledPoints = this.curve.getSpacedPoints(this.NUM_SAMPLES);

    // Evenly spaced checkpoints
    this.checkpoints = Array.from(
      { length: this.NUM_CHECKPOINTS },
      (_, i) => this.curve.getPoint(i / this.NUM_CHECKPOINTS)
    );
  }

  getTrackPosition(t: number): THREE.Vector3 {
    return this.curve.getPoint(((t % 1) + 1) % 1);
  }

  getTrackTangent(t: number): THREE.Vector3 {
    return this.curve.getTangent(((t % 1) + 1) % 1).normalize();
  }

  getSampledPoints(): THREE.Vector3[] {
    return this.sampledPoints;
  }

  /** Find the closest sampled point index to a world position */
  getClosestSampleIndex(pos: THREE.Vector3): number {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < this.sampledPoints.length; i++) {
      const d = pos.distanceToSquared(this.sampledPoints[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /** Convert a world position to a normalized t value [0,1] */
  getProgressFromPosition(pos: THREE.Vector3): number {
    return this.getClosestSampleIndex(pos) / this.NUM_SAMPLES;
  }

  checkCheckpoint(carPos: THREE.Vector3, lastIndex: number): number | null {
    const next = (lastIndex + 1) % this.NUM_CHECKPOINTS;
    const cp = this.checkpoints[next];
    if (carPos.distanceTo(cp) < 15) return next;
    return null;
  }

  checkLapComplete(passed: number[]): boolean {
    return (
      passed.length === this.NUM_CHECKPOINTS &&
      passed.every((v, i) => v === i)
    );
  }

  getCheckpoints(): THREE.Vector3[] {
    return this.checkpoints;
  }

  getCurve(): THREE.CatmullRomCurve3 {
    return this.curve;
  }
}

export const raceEngine = new RaceEngine();
