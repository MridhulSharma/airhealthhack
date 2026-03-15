"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Side-profile climber pose ────────────────────────────────────────────────
// x = depth from wall (0 = on wall, 1 = away), y = vertical offset (0 = top, 1 = bottom)
// Side profile: we see one silhouette outline, arms/legs overlap naturally
interface SidePose {
  head: [number, number];
  neck: [number, number];
  shoulderFront: [number, number];
  shoulderBack: [number, number];
  elbowUp: [number, number];      // upper arm (reaching)
  elbowLow: [number, number];     // lower arm (holding)
  handUp: [number, number];
  handLow: [number, number];
  chest: [number, number];
  hip: [number, number];
  kneeFront: [number, number];
  kneeBack: [number, number];
  footFront: [number, number];
  footBack: [number, number];
}

// 8 side-profile climbing poses — natural climbing motion seen from the side
const SIDE_POSES: SidePose[] = [
  // 0: Balanced — both hands on wall, weight centered
  {
    head: [0.35, 0.08],
    neck: [0.38, 0.12],
    shoulderFront: [0.34, 0.16], shoulderBack: [0.42, 0.15],
    elbowUp: [0.22, 0.06], elbowLow: [0.28, 0.18],
    handUp: [0.12, 0.01], handLow: [0.10, 0.12],
    chest: [0.38, 0.22],
    hip: [0.42, 0.36],
    kneeFront: [0.30, 0.50], kneeBack: [0.46, 0.52],
    footFront: [0.14, 0.56], footBack: [0.38, 0.62],
  },
  // 1: Right hand reaching high, body stretched
  {
    head: [0.32, 0.06],
    neck: [0.35, 0.10],
    shoulderFront: [0.30, 0.14], shoulderBack: [0.40, 0.13],
    elbowUp: [0.18, 0.02], elbowLow: [0.26, 0.16],
    handUp: [0.08, -0.04], handLow: [0.10, 0.10],
    chest: [0.36, 0.20],
    hip: [0.44, 0.34],
    kneeFront: [0.32, 0.46], kneeBack: [0.48, 0.50],
    footFront: [0.16, 0.52], footBack: [0.40, 0.60],
  },
  // 2: Pulling up, body compressed, knee high
  {
    head: [0.30, 0.04],
    neck: [0.33, 0.08],
    shoulderFront: [0.28, 0.12], shoulderBack: [0.38, 0.11],
    elbowUp: [0.16, 0.00], elbowLow: [0.22, 0.14],
    handUp: [0.08, -0.04], handLow: [0.10, 0.08],
    chest: [0.34, 0.18],
    hip: [0.40, 0.30],
    kneeFront: [0.24, 0.38], kneeBack: [0.44, 0.44],
    footFront: [0.12, 0.42], footBack: [0.36, 0.54],
  },
  // 3: High step — foot flagged, one arm locked off
  {
    head: [0.28, 0.06],
    neck: [0.32, 0.10],
    shoulderFront: [0.26, 0.14], shoulderBack: [0.36, 0.13],
    elbowUp: [0.14, 0.04], elbowLow: [0.20, 0.16],
    handUp: [0.06, -0.02], handLow: [0.08, 0.10],
    chest: [0.32, 0.20],
    hip: [0.38, 0.32],
    kneeFront: [0.20, 0.28], kneeBack: [0.46, 0.46],
    footFront: [0.10, 0.34], footBack: [0.40, 0.58],
  },
  // 4: Dynamic move — body extended, reaching far
  {
    head: [0.34, 0.02],
    neck: [0.36, 0.06],
    shoulderFront: [0.32, 0.10], shoulderBack: [0.40, 0.09],
    elbowUp: [0.20, -0.02], elbowLow: [0.24, 0.12],
    handUp: [0.08, -0.08], handLow: [0.10, 0.06],
    chest: [0.36, 0.16],
    hip: [0.42, 0.28],
    kneeFront: [0.28, 0.40], kneeBack: [0.48, 0.42],
    footFront: [0.14, 0.46], footBack: [0.42, 0.52],
  },
  // 5: Heel hook — creative beta, leg up high
  {
    head: [0.30, 0.04],
    neck: [0.34, 0.08],
    shoulderFront: [0.28, 0.12], shoulderBack: [0.38, 0.12],
    elbowUp: [0.16, 0.02], elbowLow: [0.22, 0.14],
    handUp: [0.06, -0.02], handLow: [0.10, 0.08],
    chest: [0.34, 0.18],
    hip: [0.40, 0.30],
    kneeFront: [0.22, 0.22], kneeBack: [0.44, 0.42],
    footFront: [0.08, 0.16], footBack: [0.38, 0.54],
  },
  // 6: Resting — shaking out, one hand off
  {
    head: [0.36, 0.06],
    neck: [0.38, 0.10],
    shoulderFront: [0.34, 0.14], shoulderBack: [0.42, 0.14],
    elbowUp: [0.22, 0.04], elbowLow: [0.44, 0.22],
    handUp: [0.10, 0.00], handLow: [0.50, 0.30],
    chest: [0.38, 0.20],
    hip: [0.42, 0.34],
    kneeFront: [0.30, 0.48], kneeBack: [0.46, 0.50],
    footFront: [0.16, 0.54], footBack: [0.40, 0.60],
  },
  // 7: Crossing over — arms crossed, body twisted
  {
    head: [0.33, 0.05],
    neck: [0.36, 0.09],
    shoulderFront: [0.30, 0.13], shoulderBack: [0.40, 0.12],
    elbowUp: [0.18, 0.01], elbowLow: [0.24, 0.15],
    handUp: [0.06, -0.04], handLow: [0.10, 0.09],
    chest: [0.36, 0.19],
    hip: [0.41, 0.33],
    kneeFront: [0.26, 0.44], kneeBack: [0.46, 0.48],
    footFront: [0.12, 0.50], footBack: [0.38, 0.58],
  },
];

function lerpSidePose(a: SidePose, b: SidePose, t: number): SidePose {
  const l = (p1: [number, number], p2: [number, number]): [number, number] => [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];
  return {
    head: l(a.head, b.head),
    neck: l(a.neck, b.neck),
    shoulderFront: l(a.shoulderFront, b.shoulderFront),
    shoulderBack: l(a.shoulderBack, b.shoulderBack),
    elbowUp: l(a.elbowUp, b.elbowUp),
    elbowLow: l(a.elbowLow, b.elbowLow),
    handUp: l(a.handUp, b.handUp),
    handLow: l(a.handLow, b.handLow),
    chest: l(a.chest, b.chest),
    hip: l(a.hip, b.hip),
    kneeFront: l(a.kneeFront, b.kneeFront),
    kneeBack: l(a.kneeBack, b.kneeBack),
    footFront: l(a.footFront, b.footFront),
    footBack: l(a.footBack, b.footBack),
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Seeded random ────────────────────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Hold shapes ──────────────────────────────────────────────────────────────
interface Hold {
  x: number; y: number;
  type: "crimp" | "jug" | "sloper" | "pinch" | "pocket";
  size: number; rotation: number;
}

function generateHolds(wallW: number, wallH: number): Hold[] {
  const rng = seededRandom(42);
  const holds: Hold[] = [];
  const types: Hold["type"][] = ["crimp", "jug", "sloper", "pinch", "pocket"];
  for (let i = 0; i < 70; i++) {
    holds.push({
      x: rng() * wallW,
      y: rng() * wallH,
      type: types[Math.floor(rng() * types.length)],
      size: 6 + rng() * 14,
      rotation: rng() * Math.PI * 2,
    });
  }
  return holds;
}

// ── Cracks ───────────────────────────────────────────────────────────────────
interface Crack { points: [number, number][]; width: number; }

function generateCracks(wallW: number, wallH: number): Crack[] {
  const rng = seededRandom(99);
  const cracks: Crack[] = [];
  for (let i = 0; i < 15; i++) {
    const pts: [number, number][] = [];
    let cx = rng() * wallW;
    let cy = rng() * wallH;
    const segs = 4 + Math.floor(rng() * 6);
    for (let j = 0; j < segs; j++) {
      pts.push([cx, cy]);
      cx += (rng() - 0.5) * 30;
      cy += rng() * 40 + 10;
    }
    cracks.push({ points: pts, width: 0.5 + rng() * 1.5 });
  }
  return cracks;
}

// ── Chalk marks ──────────────────────────────────────────────────────────────
interface ChalkMark { x: number; y: number; radius: number; opacity: number; }

function generateChalk(wallW: number, wallH: number): ChalkMark[] {
  const rng = seededRandom(77);
  const marks: ChalkMark[] = [];
  for (let i = 0; i < 25; i++) {
    marks.push({
      x: rng() * wallW, y: rng() * wallH,
      radius: 4 + rng() * 12, opacity: 0.02 + rng() * 0.04,
    });
  }
  return marks;
}

// ── Particles ────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; opacity: number;
  pulse: number; pulseSpeed: number;
}

function generateParticles(w: number, h: number): Particle[] {
  const rng = seededRandom(303);
  const particles: Particle[] = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: rng() * w,
      y: rng() * h,
      vx: (rng() - 0.5) * 0.15,
      vy: (rng() - 0.5) * 0.12 - 0.05,
      radius: 0.8 + rng() * 2.2,
      opacity: 0.04 + rng() * 0.12,
      pulse: rng() * Math.PI * 2,
      pulseSpeed: 0.008 + rng() * 0.015,
    });
  }
  return particles;
}

// ── Edge grooves & ridges ────────────────────────────────────────────────────
interface Ridge {
  y: number;
  depth: number;    // how far it protrudes
  width: number;    // vertical thickness
  type: "groove" | "ridge" | "ledge";
}

function generateRidges(wallH: number): Ridge[] {
  const rng = seededRandom(555);
  const ridges: Ridge[] = [];
  let y = 20;
  while (y < wallH) {
    const types: Ridge["type"][] = ["groove", "ridge", "ledge"];
    ridges.push({
      y,
      depth: 4 + rng() * 12,
      width: 2 + rng() * 8,
      type: types[Math.floor(rng() * types.length)],
    });
    y += 15 + rng() * 45;
  }
  return ridges;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HeroBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(0);
  const animRef = useRef(0);
  const timeRef = useRef(0);

  const wallDataRef = useRef<{
    holds: Hold[]; cracks: Crack[]; chalk: ChalkMark[];
    particles: Particle[]; ridges: Ridge[];
  } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scroll = scrollRef.current;
    timeRef.current += 1;
    const time = timeRef.current;

    const wallW = width * 0.20;
    const wallX = width - wallW;
    const wallH = height;

    if (!wallDataRef.current) {
      wallDataRef.current = {
        holds: generateHolds(wallW, wallH),
        cracks: generateCracks(wallW, wallH),
        chalk: generateChalk(wallW, wallH),
        particles: generateParticles(width, height),
        ridges: generateRidges(wallH),
      };
    }
    const { holds, cracks, chalk, particles, ridges } = wallDataRef.current;

    ctx.clearRect(0, 0, width, height);

    // ── Particles (scattered across full screen) ─────────────────────
    for (const pt of particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.pulse += pt.pulseSpeed;
      // Wrap around
      if (pt.x < -10) pt.x = width + 10;
      if (pt.x > width + 10) pt.x = -10;
      if (pt.y < -10) pt.y = height + 10;
      if (pt.y > height + 10) pt.y = -10;

      const glow = pt.opacity * (0.6 + 0.4 * Math.sin(pt.pulse));

      // Soft glowing dot
      const pg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius * 3);
      pg.addColorStop(0, `rgba(230, 57, 70, ${glow * 0.6})`);
      pg.addColorStop(0.4, `rgba(230, 57, 70, ${glow * 0.2})`);
      pg.addColorStop(1, "rgba(230, 57, 70, 0)");
      ctx.fillStyle = pg;
      ctx.fillRect(pt.x - pt.radius * 3, pt.y - pt.radius * 3, pt.radius * 6, pt.radius * 6);

      // Core
      ctx.fillStyle = `rgba(255, 200, 180, ${glow * 0.8})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Soft ambient glow in middle of screen ────────────────────────
    const midGlow = ctx.createRadialGradient(
      width * 0.45, height * 0.5, 0,
      width * 0.45, height * 0.5, width * 0.45
    );
    midGlow.addColorStop(0, "rgba(20, 18, 22, 0.25)");
    midGlow.addColorStop(0.5, "rgba(12, 10, 14, 0.10)");
    midGlow.addColorStop(1, "rgba(5, 5, 5, 0)");
    ctx.fillStyle = midGlow;
    ctx.fillRect(0, 0, width, height);

    // ── Draw wall ────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(wallX, 0);

    // Wall base — deeper, darker, with volume gradient (3D depth feel)
    const wallGrad = ctx.createLinearGradient(0, 0, wallW, 0);
    wallGrad.addColorStop(0, "rgba(8, 8, 12, 0.98)");
    wallGrad.addColorStop(0.15, "rgba(14, 14, 18, 0.96)");
    wallGrad.addColorStop(0.5, "rgba(10, 10, 14, 0.97)");
    wallGrad.addColorStop(0.85, "rgba(8, 8, 11, 0.98)");
    wallGrad.addColorStop(1, "rgba(6, 6, 8, 0.99)");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, wallW, wallH);

    // Vertical depth shading — simulate a slightly convex wall surface
    const depthGrad = ctx.createLinearGradient(0, 0, wallW, 0);
    depthGrad.addColorStop(0, "rgba(230, 57, 70, 0.03)");
    depthGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.012)");
    depthGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.006)");
    depthGrad.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, 0, wallW, wallH);

    // Stone texture noise
    const rng = seededRandom(123);
    for (let i = 0; i < 400; i++) {
      const tx = rng() * wallW;
      const ty = rng() * wallH;
      const tw = 2 + rng() * 8;
      const th = 2 + rng() * 6;
      const brightness = rng() * 0.025;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(tx, ty, tw, th);
    }

    // Horizontal ledge lines
    for (let ly = 0; ly < wallH; ly += 60 + Math.floor(rng() * 40)) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + rng() * 0.02})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      let lx = 0;
      while (lx < wallW) {
        lx += 10 + rng() * 20;
        ctx.lineTo(lx, ly + (rng() - 0.5) * 3);
      }
      ctx.stroke();
    }

    // ── Edge grooves & ridges along the left climbing edge ───────────
    for (const ridge of ridges) {
      const ry = ridge.y;
      const rd = ridge.depth;
      const rw = ridge.width;

      if (ridge.type === "ridge") {
        // Protruding ridge — lighter top edge, darker bottom
        ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(rd, ry + rw * 0.3);
        ctx.lineTo(rd * 0.6, ry + rw);
        ctx.lineTo(0, ry + rw);
        ctx.closePath();
        ctx.fill();
        // Top highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(rd, ry + rw * 0.3);
        ctx.stroke();
        // Bottom shadow
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.moveTo(0, ry + rw);
        ctx.lineTo(rd * 0.6, ry + rw);
        ctx.stroke();
      } else if (ridge.type === "groove") {
        // Indented groove — dark line with subtle highlight below
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = rw * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.quadraticCurveTo(rd * 0.5, ry + rw * 0.5, 0, ry + rw);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(1, ry + rw + 1);
        ctx.lineTo(rd * 0.3, ry + rw + 1);
        ctx.stroke();
      } else {
        // Ledge — flat protrusion with shadow underneath
        ctx.fillStyle = "rgba(18, 18, 24, 0.9)";
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(rd * 1.2, ry);
        ctx.lineTo(rd, ry + rw);
        ctx.lineTo(0, ry + rw);
        ctx.closePath();
        ctx.fill();
        // Top surface highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(rd * 1.2, ry);
        ctx.stroke();
        // Bottom shadow
        const ledgeShadow = ctx.createLinearGradient(0, ry + rw, 0, ry + rw + 8);
        ledgeShadow.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        ledgeShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = ledgeShadow;
        ctx.fillRect(0, ry + rw, rd * 1.2, 8);
      }
    }

    // Cracks
    for (const crack of cracks) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = crack.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      crack.points.forEach((cp, i) => {
        if (i === 0) ctx.moveTo(cp[0], cp[1]);
        else ctx.lineTo(cp[0], cp[1]);
      });
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = crack.width * 0.3;
      ctx.stroke();
    }

    // Chalk marks
    for (const cm of chalk) {
      const cg = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.radius);
      cg.addColorStop(0, `rgba(255, 255, 255, ${cm.opacity})`);
      cg.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = cg;
      ctx.fillRect(cm.x - cm.radius, cm.y - cm.radius, cm.radius * 2, cm.radius * 2);
    }

    // Holds — darker with soft glow outlines
    for (const hold of holds) {
      ctx.save();
      ctx.translate(hold.x, hold.y);
      ctx.rotate(hold.rotation);
      const s = hold.size;

      // Soft glow behind hold
      const holdGlow = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.2);
      holdGlow.addColorStop(0, "rgba(230, 57, 70, 0.025)");
      holdGlow.addColorStop(1, "rgba(230, 57, 70, 0)");
      ctx.fillStyle = holdGlow;
      ctx.fillRect(-s * 1.2, -s * 1.2, s * 2.4, s * 2.4);

      switch (hold.type) {
        case "jug":
          ctx.fillStyle = "rgba(16, 16, 22, 0.92)";
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.7, s * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(230, 57, 70, 0.06)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          break;
        case "crimp":
          ctx.fillStyle = "rgba(12, 12, 18, 0.88)";
          ctx.beginPath();
          ctx.moveTo(-s * 0.5, 0);
          ctx.lineTo(-s * 0.4, -s * 0.15);
          ctx.lineTo(s * 0.4, -s * 0.12);
          ctx.lineTo(s * 0.5, s * 0.05);
          ctx.lineTo(-s * 0.3, s * 0.08);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(230, 57, 70, 0.05)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
          break;
        case "sloper":
          ctx.fillStyle = "rgba(14, 14, 20, 0.85)";
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.6, s * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(230, 57, 70, 0.04)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
          break;
        case "pinch":
          ctx.fillStyle = "rgba(14, 14, 20, 0.88)";
          ctx.beginPath();
          ctx.moveTo(-s * 0.2, -s * 0.5);
          ctx.quadraticCurveTo(-s * 0.35, 0, -s * 0.15, s * 0.5);
          ctx.lineTo(s * 0.15, s * 0.45);
          ctx.quadraticCurveTo(s * 0.3, 0, s * 0.18, -s * 0.48);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(230, 57, 70, 0.04)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
          break;
        case "pocket":
          ctx.fillStyle = "rgba(4, 4, 8, 0.92)";
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(230, 57, 70, 0.06)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          break;
      }
      ctx.restore();
    }

    // ── Left edge shadow + depth ─────────────────────────────────────
    const edgeGrad = ctx.createLinearGradient(0, 0, 30, 0);
    edgeGrad.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    edgeGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.2)");
    edgeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, 30, wallH);

    // Subtle red accent line along climbing edge
    ctx.strokeStyle = "rgba(230, 57, 70, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, wallH);
    ctx.stroke();

    // Secondary inner glow line
    ctx.strokeStyle = "rgba(230, 57, 70, 0.04)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(4, wallH);
    ctx.stroke();

    // ── Draw side-profile climber ────────────────────────────────────
    const totalCycles = 3;
    const poseProgress = (scroll * totalCycles * SIDE_POSES.length) % SIDE_POSES.length;
    const poseIdx = Math.floor(poseProgress);
    const poseFrac = easeInOutCubic(poseProgress - poseIdx);
    const poseA = SIDE_POSES[poseIdx % SIDE_POSES.length];
    const poseB = SIDE_POSES[(poseIdx + 1) % SIDE_POSES.length];
    const pose = lerpSidePose(poseA, poseB, poseFrac);

    // Climber starts at bottom, moves up with scroll
    const climberBaseY = wallH * (1 - scroll * 0.75) - wallH * 0.1;
    const climberScale = wallW * 1.1;
    const climberOffsetX = wallW * 0.02;

    const p = (joint: [number, number]): [number, number] => [
      climberOffsetX + joint[0] * climberScale,
      climberBaseY + joint[1] * climberScale,
    ];

    const j = {
      head: p(pose.head), neck: p(pose.neck),
      shoulderFront: p(pose.shoulderFront), shoulderBack: p(pose.shoulderBack),
      elbowUp: p(pose.elbowUp), elbowLow: p(pose.elbowLow),
      handUp: p(pose.handUp), handLow: p(pose.handLow),
      chest: p(pose.chest), hip: p(pose.hip),
      kneeFront: p(pose.kneeFront), kneeBack: p(pose.kneeBack),
      footFront: p(pose.footFront), footBack: p(pose.footBack),
    };

    // Draw limb helper
    const drawLimb = (from: [number, number], to: [number, number], thickness: number) => {
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    // ── Climber glow aura (behind silhouette) ────────────────────────
    const auraCenterX = (j.chest[0] + j.hip[0]) / 2;
    const auraCenterY = (j.head[1] + j.hip[1]) / 2;
    const auraR = climberScale * 0.35;
    const auraGrad = ctx.createRadialGradient(
      auraCenterX, auraCenterY, auraR * 0.2,
      auraCenterX, auraCenterY, auraR
    );
    auraGrad.addColorStop(0, "rgba(230, 57, 70, 0.06)");
    auraGrad.addColorStop(0.6, "rgba(230, 57, 70, 0.02)");
    auraGrad.addColorStop(1, "rgba(230, 57, 70, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(auraCenterX, auraCenterY, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Deep dark silhouette fill
    const silColor = "rgba(8, 8, 12, 0.97)";
    ctx.strokeStyle = silColor;
    ctx.fillStyle = silColor;

    const limbW = 5.5;
    const thighW = 7;
    const torsoW = 9;

    // ── Back leg (behind torso) ──────────────────────────────────────
    ctx.strokeStyle = "rgba(6, 6, 10, 0.85)";
    drawLimb(j.hip, j.kneeBack, thighW * 0.85);
    drawLimb(j.kneeBack, j.footBack, limbW * 0.85);
    // Back foot
    ctx.fillStyle = "rgba(6, 6, 10, 0.85)";
    ctx.beginPath();
    ctx.ellipse(j.footBack[0], j.footBack[1], 5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── Back arm ─────────────────────────────────────────────────────
    drawLimb(j.shoulderBack, j.elbowLow, limbW * 0.8);
    drawLimb(j.elbowLow, j.handLow, limbW * 0.7);
    ctx.beginPath();
    ctx.arc(j.handLow[0], j.handLow[1], 3, 0, Math.PI * 2);
    ctx.fill();

    // ── Torso (side profile — narrower, athletic) ────────────────────
    ctx.fillStyle = silColor;
    ctx.strokeStyle = silColor;
    ctx.beginPath();
    ctx.moveTo(j.neck[0], j.neck[1]);
    // Front of torso (chest side)
    ctx.quadraticCurveTo(
      j.chest[0] - 4, j.chest[1],
      j.hip[0] - 2, j.hip[1]
    );
    // Back of torso
    ctx.quadraticCurveTo(
      j.chest[0] + 6, j.chest[1],
      j.neck[0] + 3, j.neck[1]
    );
    ctx.closePath();
    ctx.fill();

    // Spine/torso core
    drawLimb(j.neck, j.hip, torsoW);

    // Shoulder width (side profile — subtle)
    drawLimb(j.shoulderFront, j.shoulderBack, limbW * 0.7);

    // ── Front leg ────────────────────────────────────────────────────
    ctx.strokeStyle = silColor;
    ctx.fillStyle = silColor;
    drawLimb(j.hip, j.kneeFront, thighW);
    drawLimb(j.kneeFront, j.footFront, limbW);
    // Front foot — climbing shoe shape
    ctx.beginPath();
    ctx.ellipse(j.footFront[0], j.footFront[1], 6, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── Front arm (reaching) ─────────────────────────────────────────
    drawLimb(j.shoulderFront, j.elbowUp, limbW);
    drawLimb(j.elbowUp, j.handUp, limbW * 0.9);
    // Hand gripping
    ctx.beginPath();
    ctx.arc(j.handUp[0], j.handUp[1], 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Head (side profile — slight oval, facing wall) ───────────────
    const headRx = climberScale * 0.035;
    const headRy = climberScale * 0.042;
    ctx.beginPath();
    ctx.ellipse(j.head[0], j.head[1], headRx, headRy, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // ── Joint dots ───────────────────────────────────────────────────
    ctx.fillStyle = "rgba(4, 4, 8, 1)";
    const jointDots = [
      j.shoulderFront, j.shoulderBack,
      j.elbowUp, j.elbowLow,
      j.hip, j.kneeFront, j.kneeBack,
    ];
    for (const jd of jointDots) {
      ctx.beginPath();
      ctx.arc(jd[0], jd[1], 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Glowing accent outline on climber silhouette ─────────────────
    ctx.strokeStyle = "rgba(230, 57, 70, 0.15)";
    ctx.lineWidth = 1.2;

    // Torso outline glow
    ctx.beginPath();
    ctx.moveTo(j.neck[0] - 1, j.neck[1]);
    ctx.quadraticCurveTo(
      j.chest[0] - 5, j.chest[1],
      j.hip[0] - 3, j.hip[1]
    );
    ctx.stroke();

    // Head glow
    ctx.beginPath();
    ctx.ellipse(j.head[0], j.head[1], headRx + 1.5, headRy + 1.5, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Front arm glow
    ctx.strokeStyle = "rgba(230, 57, 70, 0.10)";
    ctx.lineWidth = 1;
    drawLimb(j.shoulderFront, j.elbowUp, 1);
    drawLimb(j.elbowUp, j.handUp, 1);

    // Front leg glow
    ctx.strokeStyle = "rgba(230, 57, 70, 0.08)";
    drawLimb(j.hip, j.kneeFront, 1);
    drawLimb(j.kneeFront, j.footFront, 1);

    ctx.restore(); // end wall translate

    // ── Soft vignette/fade from wall into main content ───────────────
    const vignetteGrad = ctx.createLinearGradient(wallX - 60, 0, wallX + 40, 0);
    vignetteGrad.addColorStop(0, "rgba(5, 5, 5, 1)");
    vignetteGrad.addColorStop(0.5, "rgba(5, 5, 5, 0.7)");
    vignetteGrad.addColorStop(1, "rgba(5, 5, 5, 0)");
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(wallX - 60, 0, 100, height);

    // ── Soft center screen ambient (softer matte black) ──────────────
    const centerSoft = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, width * 0.5
    );
    centerSoft.addColorStop(0, "rgba(18, 16, 20, 0.08)");
    centerSoft.addColorStop(0.6, "rgba(10, 10, 12, 0.04)");
    centerSoft.addColorStop(1, "rgba(5, 5, 5, 0)");
    ctx.fillStyle = centerSoft;
    ctx.fillRect(0, 0, width, height);

  }, []);

  // Animation loop
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      wallDataRef.current = null;
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      draw(ctx, window.innerWidth, window.innerHeight);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mounted, draw]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
