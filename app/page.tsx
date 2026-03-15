"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ClimbingAnimation = dynamic(
  () => import("@/components/ClimbingAnimation"),
  { ssr: false }
);

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MetricCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

const STATS = [
  { value: "2", label: "immersive training modes" },
  { value: "33", label: "body landmarks tracked" },
  { value: "Live", label: "motion feedback loop" },
  { value: "Next.js + Python", label: "real-time stack" },
];

const FEATURES = [
  {
    icon: "01",
    title: "Live movement intelligence",
    text: "Pose tracking reads body motion in real time and turns every rep into useful workout data.",
  },
  {
    icon: "02",
    title: "Performance-driven gameplay",
    text: "Your form, tempo, and consistency directly shape what happens on screen during the experience.",
  },
  {
    icon: "03",
    title: "Built for immersion",
    text: "PulseDrive makes training feel reactive, cinematic, and rewarding instead of repetitive.",
  },
];

const TECH = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "GSAP",
  "ScrollTrigger",
  "Python",
  "OpenCV",
  "MediaPipe",
  "WebSockets",
];

const MARQUEE_ITEMS = [
  "real-time pose tracking",
  "rep counting",
  "form scoring",
  "motion-driven UI",
  "cinematic feedback",
  "interactive fitness",
  "websocket streaming",
  "live training system",
];

export default function PulseDriveShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroKickerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);

      // ── Initial states ──────────────────────────────────────────────────
      gsap.set(q(".hero-line"), { y: 120, opacity: 0 });
      gsap.set(q(".hero-copy"), { y: 26, opacity: 0 });
      gsap.set(q(".hero-cta"), { y: 22, opacity: 0 });
      gsap.set(q(".nav-item"), { y: -18, opacity: 0 });
      gsap.set(q(".hero-panel"), { x: 60, opacity: 0, rotateY: -10 });
      gsap.set(q(".metric-card"), { y: 24, opacity: 0, scale: 0.94 });
      gsap.set(q(".reveal"), { y: 60, opacity: 0 });
      gsap.set(q(".tech-pill"), { y: 18, opacity: 0 });
      gsap.set(q(".marquee-track"), { xPercent: 0 });
      gsap.set(q(".hero-hr"), { scaleX: 0, transformOrigin: "left center" });
      gsap.set(q(".stat-bar"), { scaleX: 0, transformOrigin: "left center" });

      // ── Intro timeline ──────────────────────────────────────────────────
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });

      intro
        .to(q(".nav-item"), {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.06,
        })
        .to(
          heroKickerRef.current,
          {
            duration: 1.2,
            textContent: "motion-powered training system",
            ease: "none",
            snap: { textContent: 1 },
          },
          "-=0.35"
        )
        .to(
          q(".hero-line"),
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.12,
          },
          "-=0.6"
        )
        .to(
          q(".hero-hr"),
          {
            scaleX: 1,
            duration: 0.8,
            ease: "power3.inOut",
          },
          "-=0.5"
        )
        .to(
          q(".hero-copy"),
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
          },
          "-=0.7"
        )
        .to(
          q(".hero-cta"),
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
          },
          "-=0.55"
        )
        .to(
          q(".hero-panel"),
          {
            x: 0,
            opacity: 1,
            rotateY: 0,
            duration: 1.1,
          },
          "-=1"
        )
        .to(
          q(".metric-card"),
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.65,
            stagger: 0.07,
            ease: "back.out(1.4)",
          },
          "-=0.65"
        )
        .to(
          q(".stat-bar"),
          {
            scaleX: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.inOut",
          },
          "-=0.4"
        );

      // ── Ambient floats ──────────────────────────────────────────────────
      gsap.to(q(".float-slow"), {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(q(".float-fast"), {
        y: 14,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(q(".rotate-orbit"), {
        rotate: 360,
        duration: 26,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });

      // ── Marquee ─────────────────────────────────────────────────────────
      gsap.to(q(".marquee-track"), {
        xPercent: -50,
        duration: 18,
        ease: "none",
        repeat: -1,
      });

      // ── Scroll reveals ──────────────────────────────────────────────────
      q(".reveal").forEach((el) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // ── Feature cards stagger on scroll ─────────────────────────────────
      q(".feature-card").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0, rotateX: -8 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.8,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // ── Tech pills ─────────────────────────────────────────────────────
      q(".tech-pill").forEach((el, i) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.55,
          delay: i * 0.04,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
          },
        });
      });

      // ── Start workout button ────────────────────────────────────────────
      gsap.fromTo(
        ".start-workout-btn",
        {
          y: 80,
          scale: 0.88,
          opacity: 0,
          filter: "blur(10px)",
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".start-workout-btn",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.to(".start-workout-btn", {
        y: -10,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ── Story pin timeline ──────────────────────────────────────────────
      const storyTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-pin",
          start: "top top",
          end: "+=1800",
          scrub: 1,
          pin: true,
        },
      });

      storyTl
        .to(".story-bg-1", { scale: 1.18, opacity: 0.9, duration: 1 }, 0)
        .to(".story-bg-2", { scale: 1.08, opacity: 0.75, duration: 1 }, 0)
        .to(".story-copy-1", { y: -80, opacity: 0, duration: 0.8 }, 0.55)
        .fromTo(
          ".story-copy-2",
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.65
        )
        .to(".story-panel", { y: -40, rotateX: 6, duration: 1 }, 0.3)
        .to(".story-car", { x: 120, duration: 1 }, 0.25)
        .to(".story-progress", { width: "88%", duration: 1 }, 0.35)
        .to(".story-glow", { opacity: 1, scale: 1.2, duration: 1 }, 0.15);

      // ── Parallax ────────────────────────────────────────────────────────
      gsap.to(".parallax-up", {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-wrap",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".parallax-down", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-wrap",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // ── Hero panel mouse tracking ───────────────────────────────────────
      if (panelRef.current) {
        const panel = panelRef.current;

        const handleMove = (e: MouseEvent) => {
          const bounds = panel.getBoundingClientRect();
          const x = e.clientX - bounds.left - bounds.width / 2;
          const y = e.clientY - bounds.top - bounds.height / 2;

          gsap.to(panel, {
            rotateY: gsap.utils.clamp(-10, 10, x / 20),
            rotateX: gsap.utils.clamp(-10, 10, -y / 20),
            transformPerspective: 1000,
            transformOrigin: "center center",
            duration: 0.5,
            ease: "power3.out",
          });

          gsap.to(".hero-glow-follow", {
            x: x / 5,
            y: y / 5,
            duration: 0.5,
            ease: "power3.out",
          });
        };

        const handleLeave = () => {
          gsap.to(panel, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.8,
            ease: "power3.out",
          });

          gsap.to(".hero-glow-follow", {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        };

        panel.addEventListener("mousemove", handleMove);
        panel.addEventListener("mouseleave", handleLeave);

        return () => {
          panel.removeEventListener("mousemove", handleMove);
          panel.removeEventListener("mouseleave", handleLeave);
        };
      }

      // ── Hover lift cards ────────────────────────────────────────────────
      const cards = q(".hover-lift");
      cards.forEach((card) => {
        const el = card as HTMLElement;
        el.addEventListener("mouseenter", () => {
          gsap.to(el, {
            y: -10,
            scale: 1.015,
            duration: 0.35,
            ease: "power3.out",
          });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, {
            y: 0,
            scale: 1,
            duration: 0.35,
            ease: "power3.out",
          });
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <>
    {/* ── Climbing animation background (outside root div so z-index works) ── */}
    <ClimbingAnimation />

    <div
      ref={rootRef}
      className="grain-overlay relative min-h-screen overflow-x-hidden text-white"
      style={{ background: "transparent", position: "relative", zIndex: 1 }}
    >
      {/* ── Background layers (semi-transparent to let 3D bleed through) ─ */}
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(180deg,rgba(5,5,5,0.6)_0%,rgba(10,8,8,0.5)_25%,rgba(8,5,6,0.5)_50%,rgba(5,5,5,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="story-bg-1 float-slow absolute left-[-8%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#e63946]/10 blur-[140px]" />
        <div className="story-bg-2 float-fast absolute right-[-10%] top-[15%] h-[24rem] w-[24rem] rounded-full bg-[#ff6b35]/8 blur-[120px]" />
        <div className="absolute left-[25%] top-[60%] h-[20rem] w-[20rem] rounded-full bg-[#e63946]/5 blur-[100px]" />
        {/* Subtle scan line */}
        <div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e63946]/20 to-transparent"
          style={{ animation: "line-scan 8s linear infinite" }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between py-4">
          <a href="#top" className="nav-item flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#e63946]/30 bg-[#e63946]/10 text-sm font-bold text-[#e63946] transition-all duration-300 group-hover:bg-[#e63946]/20 group-hover:border-[#e63946]/50">
              PD
              <div className="pulse-glow absolute inset-0 rounded-lg bg-[#e63946]/20 blur-md" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e63946]/70">Interactive Fitness</div>
              <div className="text-base font-bold tracking-wide">
                PulseDrive
              </div>
            </div>
          </a>

          <nav className="hidden gap-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 md:flex">
            <a href="#overview" className="nav-item transition-colors duration-300 hover:text-[#e63946]">
              Overview
            </a>
            <a href="#story" className="nav-item transition-colors duration-300 hover:text-[#e63946]">
              Story
            </a>
            <a href="/select" className="nav-item transition-colors duration-300 hover:text-[#e63946]">
              Start
            </a>
            <a href="#stack" className="nav-item transition-colors duration-300 hover:text-[#e63946]">
              Stack
            </a>
          </nav>

          <a
            href="/select"
            className="nav-item group relative overflow-hidden rounded-lg bg-[#e63946] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[#d62839] hover:shadow-[0_0_30px_rgba(230,57,70,0.4)]"
          >
            <span className="relative z-10">Start Workout</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#e63946] to-[#ff6b35] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </a>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main id="top">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="mx-auto grid min-h-[96vh] w-[min(1180px,calc(100%-32px))] items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#e63946]/20 bg-[#e63946]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#e63946]/80">
              <span className="heartbeat inline-block h-2 w-2 rounded-full bg-[#e63946]" />
              <span ref={heroKickerRef}>loading system</span>
            </div>

            <h1
              ref={heroTitleRef}
              className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-tight md:text-7xl"
            >
              <div className="hero-line">Motion becomes</div>
              <div className="hero-line">
                <span className="bg-gradient-to-r from-[#e63946] to-[#ff6b35] bg-clip-text text-transparent">momentum.</span>
              </div>
            </h1>

            {/* Accent divider */}
            <div className="hero-hr mt-6 h-[3px] w-24 bg-gradient-to-r from-[#e63946] to-[#ff6b35]" />

            <p className="hero-copy mt-6 max-w-2xl text-lg leading-8 text-white/55 md:text-xl">
              PulseDrive is a real-time training experience where body movement
              drives a responsive visual world. Pose tracking, rep analysis, and
              live feedback turn workouts into something cinematic, measurable,
              and addictive in the best way.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#story"
                className="hero-cta group relative overflow-hidden rounded-lg bg-[#e63946] px-7 py-3.5 font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(230,57,70,0.35)]"
              >
                <span className="relative z-10">Enter the story</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#e63946] to-[#ff6b35] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </a>
              <a
                href="/select"
                className="hero-cta rounded-lg border border-white/10 px-7 py-3.5 font-bold uppercase tracking-[0.15em] text-white/80 transition-all duration-300 hover:border-[#e63946]/40 hover:text-[#e63946] hover:bg-[#e63946]/5"
              >
                Start workout
              </a>
            </div>

            {/* ── Marquee ────────────────────────────────────────────── */}
            <div className="mt-12 overflow-hidden rounded-lg border border-white/6 bg-white/[0.02]">
              <div className="marquee-track flex min-w-[200%] gap-3 py-3 px-2">
                {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="whitespace-nowrap rounded-md border border-white/6 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/40"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hero panel ──────────────────────────────────────────── */}
          <div
            ref={panelRef}
            className="hero-panel relative rounded-2xl border border-white/6 bg-white/[0.03] p-5 shadow-2xl shadow-black/40"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="hero-glow-follow pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.12),transparent_42%)] opacity-50 blur-2xl" />
            <div className="rotate-orbit absolute -right-10 -top-10 h-32 w-32 rounded-full border border-[#e63946]/10" />
            <div className="rotate-orbit absolute -left-8 bottom-8 h-16 w-16 rounded-full border border-[#ff6b35]/10" />

            <div className="rounded-xl border border-white/6 bg-[#0a0a0a]/80 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e63946]/60">Featured system</div>
                  <div className="text-xl font-bold">
                    PulseDrive Interface
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[#e63946]/20 bg-[#e63946]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e63946]/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e63946] pulse-glow" />
                  Live
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {STATS.map((item, i) => (
                  <div
                    key={item.label}
                    className="metric-card metric-shine relative overflow-hidden rounded-xl border border-white/6 bg-white/[0.03] p-5"
                  >
                    <div className={`text-3xl font-black md:text-4xl ${i === 0 ? "text-[#e63946]" : ""}`}>
                      {item.value}
                    </div>
                    <div className="mt-2 max-w-[12rem] text-xs font-semibold uppercase tracking-[0.1em] leading-5 text-white/40">
                      {item.label}
                    </div>
                    {/* Stat accent bar */}
                    <div className="stat-bar mt-3 h-[2px] w-full bg-gradient-to-r from-[#e63946]/40 to-transparent" />
                  </div>
                ))}
              </div>

              <div className="float-slow mt-5 rounded-xl border border-white/6 bg-white/[0.03] p-5">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Core idea</div>
                <p className="max-w-2xl text-sm leading-7 text-white/55">
                  PulseDrive connects body movement with game-like response so
                  every rep feels visible, immediate, and charged with energy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        <section
          id="overview"
          className="parallax-wrap stripe-bg mx-auto w-[min(1180px,calc(100%-32px))] py-20"
        >
          <div className="reveal mb-14 max-w-3xl parallax-up">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#e63946]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#e63946]/70">
                Overview
              </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
              Designed to make training feel{" "}
              <span className="bg-gradient-to-r from-[#e63946] to-[#ff6b35] bg-clip-text text-transparent">alive</span>{" "}
              instead of repetitive.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((item, index) => (
              <div
                key={item.title}
                className={`feature-card hover-lift relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.03] p-7 shadow-2xl shadow-black/30 transition-all duration-500 hover:border-[#e63946]/20 ${
                  index % 2 === 0 ? "parallax-up" : "parallax-down"
                }`}
              >
                {/* Corner accent */}
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-[#e63946]/8 to-transparent" />

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[#e63946]/20 bg-[#e63946]/5 text-sm font-black text-[#e63946]">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/50">
                  {item.text}
                </p>
                {/* Bottom accent line */}
                <div className="mt-5 h-[2px] w-12 bg-gradient-to-r from-[#e63946]/40 to-transparent" />
              </div>
            ))}
          </div>
        </section>

        {/* ── STORY ────────────────────────────────────────────────────── */}
        <section
          id="story"
          className="story-pin mx-auto w-[min(1180px,calc(100%-32px))] py-16"
        >
          <div className="grid min-h-[85vh] items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative">
              <div className="story-copy-1 absolute inset-0 flex flex-col justify-center">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-[2px] w-8 bg-[#e63946]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#e63946]/70">
                    Story sequence
                  </span>
                </div>
                <h2 className="max-w-2xl text-4xl font-black uppercase tracking-tight md:text-5xl">
                  What starts as movement becomes a world that responds back.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">
                  The site shifts from product reveal into a motion narrative,
                  showing how physical effort becomes data, speed, progression,
                  and visual payoff.
                </p>
              </div>

              <div className="story-copy-2 absolute inset-0 flex flex-col justify-center opacity-0">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-[2px] w-8 bg-[#ff6b35]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#ff6b35]/70">
                    Scroll transformation
                  </span>
                </div>
                <h2 className="max-w-2xl text-4xl font-black uppercase tracking-tight md:text-5xl">
                  Real-time feedback makes every rep feel heavier, faster, and
                  more meaningful.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">
                  This is where PulseDrive feels different: progress is not just
                  stored, it is staged. Every action is reflected on screen with
                  motion and consequence.
                </p>
              </div>
            </div>

            {/* ── Story panel ────────────────────────────────────────── */}
            <div className="story-panel relative rounded-2xl border border-white/6 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
              <div className="story-glow pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.12),transparent_44%)] opacity-0 blur-2xl" />
              <div className="rounded-xl border border-white/6 bg-[#0a0a0a]/80 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Live preview</div>
                    <div className="text-xl font-bold">Velocity Scene</div>
                  </div>
                  <div className="rounded-md border border-[#ff6b35]/20 bg-[#ff6b35]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6b35]/70">
                    Scroll-reactive
                  </div>
                </div>

                <div className="relative h-[360px] overflow-hidden rounded-xl border border-white/6 bg-gradient-to-b from-[#e63946]/5 to-[#0a0a0a] p-5">
                  <div className="absolute inset-x-8 top-1/2 h-[140px] -translate-y-1/2 rounded-[999px] border border-dashed border-[#e63946]/10" />
                  <div className="absolute inset-x-12 top-1/2 h-[92px] -translate-y-1/2 rounded-[999px] border border-white/6 bg-black/25" />

                  <div className="story-car absolute left-[24%] top-1/2 z-10 -translate-y-1/2">
                    <div className="relative h-9 w-24 rounded-full border border-[#e63946]/30 bg-[#e63946]">
                      <div className="absolute -bottom-2 left-2 h-5 w-5 rounded-full bg-black border border-white/10" />
                      <div className="absolute -bottom-2 right-2 h-5 w-5 rounded-full bg-black border border-white/10" />
                      <div className="absolute -right-8 top-1/2 h-4 w-10 -translate-y-1/2 rounded-full bg-[#ff6b35]/70 blur-md" />
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-3">
                    <MetricCard label="Rep State" value="up" accent />
                    <MetricCard label="Elbow Angle" value="164" />
                    <MetricCard label="Form Score" value="92%" accent />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                    Progress mapped to momentum
                  </div>
                  <div className="h-3 overflow-hidden rounded-md border border-white/6 bg-white/[0.03]">
                    <div className="story-progress h-full w-[22%] rounded-md bg-gradient-to-r from-[#e63946] to-[#ff6b35]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── START WORKOUT CTA ────────────────────────────────────────── */}
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
          <div className="reveal relative overflow-hidden rounded-2xl border border-[#e63946]/15 bg-gradient-to-br from-[#e63946]/8 via-[#0a0a0a] to-[#ff6b35]/5 px-8 py-20 text-center shadow-2xl shadow-black/30 md:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.1),transparent_38%)] opacity-70 blur-2xl" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 h-20 w-[1px] bg-gradient-to-b from-[#e63946]/40 to-transparent" />
            <div className="absolute top-0 left-0 h-[1px] w-20 bg-gradient-to-r from-[#e63946]/40 to-transparent" />
            <div className="absolute bottom-0 right-0 h-20 w-[1px] bg-gradient-to-t from-[#e63946]/40 to-transparent" />
            <div className="absolute bottom-0 right-0 h-[1px] w-20 bg-gradient-to-l from-[#e63946]/40 to-transparent" />

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="h-[2px] w-6 bg-[#e63946]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#e63946]/70">
                  Live workout launch
                </span>
                <div className="h-[2px] w-6 bg-[#e63946]" />
              </div>

              <h2 className="mx-auto max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
                Start the workout{" "}
                <span className="bg-gradient-to-r from-[#e63946] to-[#ff6b35] bg-clip-text text-transparent">experience.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
                Launch the live training flow and connect this interface to your
                pose detection, fatigue tracking, and game logic.
              </p>

              <div className="mt-12 flex justify-center">
                <ScrambleButton label="START WORKOUT" href="/select" />
              </div>

              <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">
                Ready for Python detection + fatigue + game integration
              </div>
            </div>
          </div>
        </section>

        {/* ── TECH STACK ───────────────────────────────────────────────── */}
        <section
          id="stack"
          className="mx-auto w-[min(1180px,calc(100%-32px))] py-16"
        >
          <div className="reveal mb-10 max-w-3xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#e63946]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#e63946]/70">
                Technology
              </span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
              Built on a real-time modern stack.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="reveal hover-lift rounded-2xl border border-white/6 bg-white/[0.03] p-8 shadow-2xl shadow-black/30">
              <p className="text-sm leading-7 text-white/50">
                PulseDrive combines frontend motion design, live body analysis,
                and streamed workout data into a system that feels polished
                enough for a real product launch.
              </p>
              <div className="mt-6 h-[2px] w-16 bg-gradient-to-r from-[#e63946]/40 to-transparent" />
            </div>

            <div className="reveal rounded-2xl border border-white/6 bg-white/[0.03] p-8 shadow-2xl shadow-black/30">
              <div className="flex flex-wrap gap-2.5">
                {TECH.map((item) => (
                  <div
                    key={item}
                    className="tech-pill rounded-md border border-white/6 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white/60 transition-all duration-300 hover:border-[#e63946]/25 hover:bg-[#e63946]/5 hover:text-[#e63946]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER / FINAL CTA ───────────────────────────────────────── */}
        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
          <div className="reveal hover-lift rounded-2xl border border-white/6 bg-white/[0.03] px-8 py-14 text-center shadow-2xl shadow-black/30 md:px-16">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-[2px] w-6 bg-[#e63946]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30">
                Final impression
              </span>
              <div className="h-[2px] w-6 bg-[#e63946]" />
            </div>
            <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase tracking-tight md:text-5xl">
              PulseDrive turns fitness into a responsive digital{" "}
              <span className="bg-gradient-to-r from-[#e63946] to-[#ff6b35] bg-clip-text text-transparent">experience.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/50">
              It is more than a tracker. It is a motion-driven system that makes
              effort feel immediate, visual, and worth returning to.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#top"
                className="group relative overflow-hidden rounded-lg border border-white/10 px-7 py-3.5 font-bold uppercase tracking-[0.15em] text-white/80 transition-all duration-300 hover:border-[#e63946]/40 hover:text-[#e63946]"
              >
                Back to top
              </a>
            </div>
          </div>
        </section>

        {/* ── Bottom border accent ─────────────────────────────────────── */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#e63946]/30 to-transparent" />
      </main>
    </div>
    </>
  );
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="metric-card rounded-xl border border-white/6 bg-[#0a0a0a]/80 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</div>
      <div className={`mt-2 text-2xl font-black ${accent ? "text-[#e63946]" : ""}`}>{value}</div>
    </div>
  );
}

function ScrambleButton({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const chars = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", []);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const original = label;
    let frame = 0;
    let raf = 0;
    const totalFrames = 24;

    const runScramble = () => {
      cancelAnimationFrame(raf);
      frame = 0;

      const update = () => {
        const progress = frame / totalFrames;

        const scrambled = original
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < progress * original.length) return original[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        el.textContent = scrambled;

        if (frame < totalFrames) {
          frame += 0.25;
          raf = requestAnimationFrame(update);
        } else {
          el.textContent = original;
        }
      };

      update();
    };

    el.addEventListener("mouseenter", runScramble);
    el.addEventListener("focus", runScramble);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", runScramble);
      el.removeEventListener("focus", runScramble);
    };
  }, [chars, label]);

  return (
    <a
      ref={buttonRef}
      href={href}
      className="start-workout-btn inline-flex min-w-[320px] items-center justify-center rounded-xl bg-gradient-to-r from-[#e63946] via-[#d62839] to-[#ff6b35] px-12 py-6 text-lg font-black uppercase tracking-[0.3em] text-white shadow-[0_10px_60px_rgba(230,57,70,0.3)] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_80px_rgba(230,57,70,0.45)] md:min-w-[380px] md:px-16 md:py-7 md:text-xl"
    >
      {label}
    </a>
  );
}
