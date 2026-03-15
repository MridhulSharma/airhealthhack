import * as THREE from "three";

// Red Bull Ring (Spielberg) approximate spline layout
// SCALE_CALIBRATION: these control points are placeholder — adjust Y and scale after first render
const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(80, 0, -20),
  new THREE.Vector3(160, 5, -60),
  new THREE.Vector3(180, 8, -130),
  new THREE.Vector3(150, 10, -200),
  new THREE.Vector3(100, 12, -240),
  new THREE.Vector3(40, 14, -260),
  new THREE.Vector3(-30, 14, -250),
  new THREE.Vector3(-80, 12, -220),
  new THREE.Vector3(-110, 10, -170),
  new THREE.Vector3(-120, 8, -110),
  new THREE.Vector3(-100, 6, -50),
  new THREE.Vector3(-70, 4, 10),
  new THREE.Vector3(-30, 2, 40),
  new THREE.Vector3(0, 0, 0),
];

export class RaceEngine {
  private curve: THREE.CatmullRomCurve3;
  private checkpoints: THREE.Vector3[];
  private readonly NUM_CHECKPOINTS = 10;

  constructor() {
    this.curve = new THREE.CatmullRomCurve3(
      TRACK_POINTS,
      true,
      "catmullrom",
      0.5
    );
    this.checkpoints = this.buildCheckpoints();
  }

  private buildCheckpoints(): THREE.Vector3[] {
    return Array.from({ length: this.NUM_CHECKPOINTS }, (_, i) =>
      this.curve.getPoint(i / this.NUM_CHECKPOINTS)
    );
  }

  getTrackPosition(t: number): THREE.Vector3 {
    return this.curve.getPoint(t % 1);
  }

  getTrackTangent(t: number): THREE.Vector3 {
    return this.curve.getTangent(t % 1).normalize();
  }

  checkCheckpoint(carPos: THREE.Vector3, lastIndex: number): number | null {
    const next = (lastIndex + 1) % this.NUM_CHECKPOINTS;
    const cp = this.checkpoints[next];
    if (carPos.distanceTo(cp) < 12) return next;
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
