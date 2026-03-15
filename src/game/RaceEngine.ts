import * as THREE from "three";

// Red Bull Ring - calibrated to loaded track geometry
// Tension: 0.5 for smooth interpolation
// Last point manually closes back to first point smoothly
const TRACK_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(-19.15, 12.18, -170.39),
  new THREE.Vector3(50.0, 14.0, -150.0),
  new THREE.Vector3(111.15, 15.92, -129.24),
  new THREE.Vector3(143.3, 12.84, -100.39),
  new THREE.Vector3(142.69, 10.01, -74.77),
  new THREE.Vector3(160.0, 7.0, -45.0),
  new THREE.Vector3(180.42, 5.08, -18.27),
  new THREE.Vector3(145.62, 2.58, -7.0),
  new THREE.Vector3(110.67, 1.44, -5.28),
  new THREE.Vector3(68.26, 0.45, -13.81),
  new THREE.Vector3(41.35, -0.27, -13.28),
  new THREE.Vector3(15.36, -0.42, -18.74),
  new THREE.Vector3(-3.22, -0.33, -12.38),
  new THREE.Vector3(-27.11, -0.25, -30.35),
  new THREE.Vector3(-39.98, 0.0, -10.53),
  new THREE.Vector3(-58.4, 0.96, -23.37),
  new THREE.Vector3(-75.25, 2.13, -22.34),
  new THREE.Vector3(-92.61, 3.71, -17.23),
  new THREE.Vector3(-111.24, 6.03, -15.94),
  new THREE.Vector3(-133.32, 9.35, -11.6),
  new THREE.Vector3(-149.35, 11.76, -18.2),
  new THREE.Vector3(-147.94, 13.6, -51.63),
  new THREE.Vector3(-133.69, 13.92, -96.9),
  new THREE.Vector3(-132.28, 10.66, -113.95),
  new THREE.Vector3(-141.77, 9.77, -118.64),
  new THREE.Vector3(-151.5, 9.24, -124.71),
  new THREE.Vector3(-157.32, 9.24, -133.66),
  new THREE.Vector3(-163.03, 9.65, -143.0),
  new THREE.Vector3(-169.56, 10.25, -152.53),
  new THREE.Vector3(-175.0, 11.18, -162.63),
  new THREE.Vector3(-175.11, 12.15, -173.64),
  new THREE.Vector3(-175.13, 13.0, -185.14),
  new THREE.Vector3(-179.09, 14.27, -197.5),
  new THREE.Vector3(-182.8, 15.85, -210.26),
  new THREE.Vector3(-183.36, 17.68, -224.61),
  new THREE.Vector3(-181.44, 19.23, -237.98),
  new THREE.Vector3(-196.63, 22.21, -264.46),
  new THREE.Vector3(-221.62, 29.53, -305.87),
  new THREE.Vector3(-240.0, 38.0, -340.0),
  new THREE.Vector3(-260.23, 45.6, -373.05),
  new THREE.Vector3(-211.03, 47.88, -353.96),
  new THREE.Vector3(-161.67, 44.14, -324.52),
  new THREE.Vector3(-145.49, 42.97, -331.5),
  new THREE.Vector3(-122.36, 41.36, -321.88),
  new THREE.Vector3(-102.59, 40.23, -310.88),
  new THREE.Vector3(-86.14, 39.25, -300.6),
  new THREE.Vector3(-73.37, 38.33, -299.65),
  new THREE.Vector3(-61.12, 37.35, -290.97),
  new THREE.Vector3(-49.54, 36.44, -289.19),
  new THREE.Vector3(-38.69, 35.4, -284.0),
  new THREE.Vector3(-31.45, 34.12, -270.62),
  new THREE.Vector3(-22.63, 33.04, -266.34),
  new THREE.Vector3(-13.16, 31.59, -262.32),
  new THREE.Vector3(-0.19, 30.2, -260.95),
  new THREE.Vector3(23.84, 29.03, -268.71),
  new THREE.Vector3(35.08, 27.84, -261.95),
  new THREE.Vector3(37.72, 26.13, -246.82),
  new THREE.Vector3(34.61, 24.72, -234.62),
  // --- closure section: bridge back to start smoothly ---
  new THREE.Vector3(28.0, 22.0, -220.0),
  new THREE.Vector3(18.0, 19.0, -210.0),
  new THREE.Vector3(8.0, 16.5, -200.0),
  new THREE.Vector3(-2.0, 14.5, -190.0),
  new THREE.Vector3(-10.0, 13.0, -180.0),
  new THREE.Vector3(-19.15, 12.18, -170.39), // back to start
];

export class RaceEngine {
  private curve: THREE.CatmullRomCurve3;
  private readonly NUM_CHECKPOINTS = 10;
  private checkpoints: THREE.Vector3[];

  constructor() {
    this.curve = new THREE.CatmullRomCurve3(
      TRACK_POINTS,
      false,        // NOT closed — we manually close it with the last point
      "catmullrom",
      0.5           // smooth tension — do not change this value
    );
    this.checkpoints = Array.from(
      { length: this.NUM_CHECKPOINTS },
      (_, i) => this.curve.getPoint(i / this.NUM_CHECKPOINTS)
    );
  }

  getTrackPosition(t: number): THREE.Vector3 {
    return this.curve.getPoint(Math.min(t % 1, 0.9999));
  }

  getTrackTangent(t: number): THREE.Vector3 {
    return this.curve.getTangent(Math.min(t % 1, 0.9999)).normalize();
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

  buildCheckpoints(): THREE.Vector3[] {
    return this.checkpoints;
  }

  getCurve(): THREE.CatmullRomCurve3 {
    return this.curve;
  }
}

export const raceEngine = new RaceEngine();
