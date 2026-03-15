"use client";

import { useEffect, useRef, useState } from "react";

// ── Rock face SVG path — jagged, organic cliff with overhangs ────────────────
// Right-side cliff: the right edge is straight (screen edge), left edge is jagged
const ROCK_PATH = `
M 500 0
L 500 700
L 340 700
L 338 692
Q 330 685, 335 678
L 342 665
Q 348 655, 340 645
L 330 630
Q 322 618, 328 608
L 340 595
Q 352 582, 345 570
L 332 555
Q 318 540, 325 528
L 338 518
Q 348 508, 342 495
L 328 480
Q 315 465, 322 452
L 340 442
Q 355 430, 348 415
L 330 400
Q 310 385, 318 372
L 335 362
Q 350 348, 338 335
L 315 320
Q 295 308, 305 295
L 325 282
Q 342 268, 330 255
L 310 242
Q 290 228, 302 215
L 322 205
Q 340 192, 328 178
L 308 165
Q 288 150, 300 138
L 320 128
Q 338 115, 325 102
L 305 90
Q 288 78, 298 65
L 318 52
Q 335 38, 322 25
L 308 12
Q 300 5, 310 0
Z
`;

// ── Overhang section (mid-wall protrusion) ───────────────────────────────────
const OVERHANG_PATH = `
M 340 280
Q 310 275, 285 282
Q 260 290, 270 310
Q 275 325, 295 322
Q 310 318, 325 312
Q 340 305, 342 295
Z
`;

// ── Rock texture cracks ──────────────────────────────────────────────────────
const CRACKS = [
  "M 420 50 Q 410 80, 415 110 Q 420 130, 408 155",
  "M 380 180 Q 370 210, 375 240 Q 382 260, 372 285",
  "M 450 300 Q 440 330, 445 360",
  "M 390 400 Q 380 425, 385 450 Q 392 470, 382 500",
  "M 430 520 Q 420 545, 425 570 Q 430 590, 418 615",
  "M 360 100 Q 355 115, 362 130",
  "M 470 200 Q 462 225, 468 250",
  "M 400 340 Q 392 360, 398 380",
  "M 355 480 Q 348 500, 355 520",
  "M 440 620 Q 432 640, 438 660",
  "M 375 560 Q 368 575, 378 590",
  "M 410 440 Q 402 455, 412 468",
];

// ── Small bump/texture paths along the rock face ─────────────────────────────
const BUMPS = [
  "M 345 55 Q 340 52, 338 56 Q 336 60, 342 58",
  "M 332 120 Q 326 116, 324 122 Q 322 128, 330 124",
  "M 350 195 Q 344 190, 341 196 Q 338 202, 347 198",
  "M 320 260 Q 314 256, 310 262 Q 307 268, 316 264",
  "M 338 340 Q 332 336, 328 342 Q 325 348, 335 344",
  "M 325 420 Q 318 416, 315 422 Q 312 428, 322 425",
  "M 345 500 Q 338 496, 335 502 Q 332 508, 342 504",
  "M 330 575 Q 324 570, 320 576 Q 316 582, 328 578",
  "M 342 640 Q 336 636, 332 642 Q 328 648, 340 644",
  "M 355 85 Q 350 80, 346 86 Q 343 92, 352 88",
  "M 310 310 Q 305 306, 302 312 Q 298 318, 308 314",
  "M 348 460 Q 342 456, 340 462 Q 337 468, 346 464",
  "M 335 150 Q 330 145, 326 151 Q 323 157, 333 153",
  "M 322 380 Q 316 376, 312 382 Q 309 388, 320 384",
  "M 340 530 Q 334 526, 330 532 Q 327 538, 338 534",
  "M 350 235 Q 344 230, 340 236 Q 337 242, 348 238",
  "M 318 600 Q 312 596, 308 602 Q 305 608, 316 604",
  "M 360 690 Q 355 685, 351 691 Q 348 697, 358 693",
  "M 328 42 Q 322 38, 318 44 Q 315 50, 326 46",
  "M 335 680 Q 330 676, 326 682 Q 323 688, 333 684",
];

function lerpValue(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function ClimbingAnimation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;
      setProgress(p);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Used by particles for scroll-based drift
  void progress;

  return (
    <div
      ref={sectionRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
        <svg
          viewBox="0 0 500 700"
          width="100%"
          height="100%"
          preserveAspectRatio="xMaxYMid slice"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            {/* Rock texture filter */}
            <filter id="rockNoise" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="6" seed="2" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>

{/* Glow for accent elements */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip path for rock texture overlay */}
            <clipPath id="rockClip">
              <path d={ROCK_PATH} />
            </clipPath>
          </defs>

          {/* ── Rock face ─────────────────────────────────────────────── */}
          <g>
            {/* Main rock body — lighter than page bg so it's visible */}
            <path
              d={ROCK_PATH}
              fill="#16161e"
              stroke="none"
            />

            {/* Rock texture overlay */}
            <g clipPath="url(#rockClip)" opacity="0.25">
              <rect x="280" y="0" width="220" height="700" filter="url(#rockNoise)" />
            </g>

            {/* Overhang */}
            <path
              d={OVERHANG_PATH}
              fill="#121218"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.8"
            />

            {/* Overhang shadow underneath */}
            <ellipse
              cx="310" cy="328" rx="30" ry="8"
              fill="black" opacity="0.5"
            />

            {/* Cracks — more visible */}
            {CRACKS.map((crack, i) => (
              <path
                key={`crack-${i}`}
                d={crack}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            ))}

            {/* Bump textures — more visible */}
            {BUMPS.map((bump, i) => (
              <path
                key={`bump-${i}`}
                d={bump}
                fill="rgba(255,255,255,0.06)"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.6"
              />
            ))}

            {/* Edge highlight — crimson glow on jagged edge */}
            <path
              d={ROCK_PATH}
              fill="none"
              stroke="rgba(230,57,70,0.25)"
              strokeWidth="2"
            />
            {/* Wider soft glow behind edge */}
            <path
              d={ROCK_PATH}
              fill="none"
              stroke="rgba(230,57,70,0.08)"
              strokeWidth="6"
              filter="url(#glow)"
            />

            {/* Depth gradient on rock face */}
            <defs>
              <linearGradient id="rockDepth" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(230,57,70,0.12)" />
                <stop offset="40%" stopColor="rgba(230,57,70,0.02)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path d={ROCK_PATH} fill="url(#rockDepth)" />

            {/* Vertical ridges — more visible */}
            {[340, 370, 400, 430, 460].map((x, i) => (
              <line
                key={`ridge-${i}`}
                x1={x} y1="0" x2={x + (i % 2 === 0 ? 2 : -2)} y2="700"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.7"
              />
            ))}

            {/* Horizontal ledge lines */}
            {[85, 170, 255, 340, 425, 510, 595].map((y, i) => (
              <path
                key={`ledge-${i}`}
                d={`M 330 ${y} Q 380 ${y + (i % 2 === 0 ? 3 : -3)}, 500 ${y}`}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.8"
              />
            ))}

            {/* Hold dots on the rock face */}
            {[
              [350, 60], [370, 130], [345, 200], [380, 270], [355, 330],
              [390, 390], [360, 450], [375, 510], [350, 570], [385, 630],
              [365, 90], [395, 160], [340, 240], [370, 310], [355, 380],
              [400, 440], [345, 520], [380, 580], [360, 650], [390, 100],
              [350, 170], [375, 240], [395, 350], [340, 490], [365, 560],
            ].map(([x, y], i) => (
              <g key={`hold-${i}`}>
                <circle cx={x} cy={y} r={2 + (i % 3)} fill="#0e0e14" />
                <circle cx={x} cy={y} r={4 + (i % 3)} fill="none" stroke="rgba(230,57,70,0.12)" strokeWidth="0.8" />
              </g>
            ))}
          </g>

          {/* ── Scattered particles ───────────────────────────────── */}
          {Array.from({ length: 40 }, (_, i) => {
            const seed = i * 137.508;
            const px = 100 + (seed % 380);
            const py = ((seed * 2.3 + progress * 700 * ((i % 3) + 1) * 0.2) % 700);
            const r = 0.8 + (i % 4) * 0.5;
            const opacity = 0.08 + (i % 5) * 0.03;
            return (
              <g key={`particle-${i}`}>
                <circle
                  cx={px} cy={py} r={r * 4}
                  fill={`rgba(230,57,70,${opacity * 0.4})`}
                  filter="url(#glow)"
                />
                <circle
                  cx={px} cy={py} r={r}
                  fill={`rgba(255,220,200,${opacity})`}
                />
              </g>
            );
          })}
        </svg>
    </div>
  );
}
