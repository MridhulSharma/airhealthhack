"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type FeatureProps = {
  title: string;
  text: string;
};

type MetricCardProps = {
  label: string;
  value: string;
};

const STATS = [
  { value: "2", label: "immersive training modes" },
  { value: "33", label: "body landmarks tracked" },
  { value: "Live", label: "motion feedback loop" },
  { value: "Next.js + Python", label: "real-time stack" },
];

const FEATURES = [
  {
    title: "Live movement intelligence",
    text: "Pose tracking reads body motion in real time and turns every rep into useful workout data.",
  },
  {
    title: "Performance-driven gameplay",
    text: "Your form, tempo, and consistency directly shape what happens on screen during the experience.",
  },
  {
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

export default function PulseDriveShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroKickerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);

      gsap.set(q(".hero-line"), { y: 120, opacity: 0 });
      gsap.set(q(".hero-copy"), { y: 26, opacity: 0 });
      gsap.set(q(".hero-cta"), { y: 22, opacity: 0 });
      gsap.set(q(".nav-item"), { y: -18, opacity: 0 });
      gsap.set(q(".hero-panel"), { x: 60, opacity: 0, rotateY: -10 });
      gsap.set(q(".metric-card"), { y: 24, opacity: 0, scale: 0.94 });
      gsap.set(q(".reveal"), { y: 60, opacity: 0 });
      gsap.set(q(".tech-pill"), { y: 18, opacity: 0 });
      gsap.set(q(".marquee-track"), { xPercent: 0 });

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
        );

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

      gsap.to(q(".marquee-track"), {
        xPercent: -50,
        duration: 18,
        ease: "none",
        repeat: -1,
      });

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

      q(".tech-pill").forEach((el, i) => {
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
    <div
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-[#050505] text-white"
    >
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(180deg,#050505_0%,#080808_35%,#050505_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="story-bg-1 float-slow absolute left-[-8%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-white/10 blur-[120px]" />
        <div className="story-bg-2 float-fast absolute right-[-10%] top-[15%] h-[24rem] w-[24rem] rounded-full bg-white/7 blur-[120px]" />
        <div className="absolute left-[25%] top-[60%] h-[20rem] w-[20rem] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between py-4">
          <a href="#top" className="nav-item flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold">
              PD
            </div>
            <div>
              <div className="text-sm text-white/55">Interactive Fitness</div>
              <div className="text-lg font-semibold tracking-wide">
                PulseDrive
              </div>
            </div>
          </a>

          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <a href="#overview" className="nav-item hover:text-white">
              Overview
            </a>
            <a href="#story" className="nav-item hover:text-white">
              Story
            </a>
            <a href="#start-workout" className="nav-item hover:text-white">
              Start
            </a>
            <a href="#stack" className="nav-item hover:text-white">
              Stack
            </a>
          </nav>

          <a
            href="#start-workout"
            className="nav-item rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Start Workout
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid min-h-[96vh] w-[min(1180px,calc(100%-32px))] items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/65">
              <span ref={heroKickerRef}>loading system</span>
            </div>

            <h1
              ref={heroTitleRef}
              className="max-w-4xl text-5xl font-semibold leading-[0.96] md:text-7xl"
            >
              <div className="hero-line">Motion becomes</div>
              <div className="hero-line">momentum.</div>
            </h1>

            <p className="hero-copy mt-6 max-w-2xl text-lg leading-8 text-white/68 md:text-xl">
              PulseDrive is a real-time training experience where body movement
              drives a responsive visual world. Pose tracking, rep analysis, and
              live feedback turn workouts into something cinematic, measurable,
              and addictive in the best way.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#story"
                className="hero-cta rounded-full bg-white px-7 py-3 font-semibold text-black transition hover:scale-105"
              >
                Enter the story
              </a>
              <a
                href="#start-workout"
                className="hero-cta rounded-full border border-white/15 px-7 py-3 font-semibold text-white/90 transition hover:bg-white/5"
              >
                Start workout
              </a>
            </div>

            <div className="mt-12 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
              <div className="marquee-track flex min-w-[200%] gap-4 py-3">
                {[
                  "real-time pose tracking",
                  "rep counting",
                  "form scoring",
                  "motion-driven UI",
                  "cinematic feedback",
                  "interactive fitness",
                  "websocket streaming",
                  "live training system",
                ]
                  .concat([
                    "real-time pose tracking",
                    "rep counting",
                    "form scoring",
                    "motion-driven UI",
                    "cinematic feedback",
                    "interactive fitness",
                    "websocket streaming",
                    "live training system",
                  ])
                  .map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70"
                    >
                      {item}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div
            ref={panelRef}
            className="hero-panel relative rounded-[36px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/40"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="hero-glow-follow pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_42%)] opacity-50 blur-2xl" />
            <div className="rotate-orbit absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10" />
            <div className="rotate-orbit absolute -left-8 bottom-8 h-16 w-16 rounded-full border border-white/10" />

            <div className="rounded-[30px] border border-white/10 bg-black/30 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/50">Featured system</div>
                  <div className="text-2xl font-semibold">
                    PulseDrive Interface
                  </div>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65">
                  Real-time concept
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {STATS.map((item) => (
                  <div
                    key={item.label}
                    className="metric-card rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="text-3xl font-semibold md:text-4xl">
                      {item.value}
                    </div>
                    <div className="mt-3 max-w-[12rem] text-sm leading-6 text-white/60">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="float-slow mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-3 text-sm text-white/50">Core idea</div>
                <p className="max-w-2xl text-base leading-7 text-white/72">
                  PulseDrive connects body movement with game-like response so
                  every rep feels visible, immediate, and charged with energy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="overview"
          className="parallax-wrap mx-auto w-[min(1180px,calc(100%-32px))] py-14"
        >
          <div className="reveal mb-10 max-w-3xl parallax-up">
            <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
              Overview
            </div>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Designed to make training feel alive instead of repetitive.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((item, index) => (
              <div
                key={item.title}
                className={`reveal hover-lift rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 ${
                  index % 2 === 0 ? "parallax-up" : "parallax-down"
                }`}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/6 text-lg font-semibold">
                  +
                </div>
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-white/68">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="story"
          className="story-pin mx-auto w-[min(1180px,calc(100%-32px))] py-16"
        >
          <div className="grid min-h-[85vh] items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative">
              <div className="story-copy-1 absolute inset-0 flex flex-col justify-center">
                <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
                  Story sequence
                </div>
                <h2 className="max-w-2xl text-4xl font-semibold md:text-5xl">
                  What starts as movement becomes a world that responds back.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                  The site shifts from product reveal into a motion narrative,
                  showing how physical effort becomes data, speed, progression,
                  and visual payoff.
                </p>
              </div>

              <div className="story-copy-2 absolute inset-0 flex flex-col justify-center opacity-0">
                <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
                  Scroll transformation
                </div>
                <h2 className="max-w-2xl text-4xl font-semibold md:text-5xl">
                  Real-time feedback makes every rep feel heavier, faster, and
                  more meaningful.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                  This is where PulseDrive feels different: progress is not just
                  stored, it is staged. Every action is reflected on screen with
                  motion and consequence.
                </p>
              </div>
            </div>

            <div className="story-panel relative rounded-[34px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30">
              <div className="story-glow pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_44%)] opacity-0 blur-2xl" />
              <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/50">Live preview</div>
                    <div className="text-2xl font-semibold">Velocity Scene</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65">
                    Scroll-reactive
                  </div>
                </div>

                <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-5">
                  <div className="absolute inset-x-8 top-1/2 h-[140px] -translate-y-1/2 rounded-[999px] border border-dashed border-white/12" />
                  <div className="absolute inset-x-12 top-1/2 h-[92px] -translate-y-1/2 rounded-[999px] border border-white/10 bg-black/25" />

                  <div className="story-car absolute left-[24%] top-1/2 z-10 -translate-y-1/2">
                    <div className="relative h-9 w-24 rounded-full border border-white/20 bg-white/90">
                      <div className="absolute -bottom-2 left-2 h-5 w-5 rounded-full bg-black" />
                      <div className="absolute -bottom-2 right-2 h-5 w-5 rounded-full bg-black" />
                      <div className="absolute -right-8 top-1/2 h-4 w-10 -translate-y-1/2 rounded-full bg-white/70 blur-md" />
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-3">
                    <MetricCard label="Rep State" value="up" />
                    <MetricCard label="Elbow Angle" value="164°" />
                    <MetricCard label="Form Score" value="92%" />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 text-sm text-white/55">
                    Progress mapped to momentum
                  </div>
                  <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/5">
                    <div className="story-progress h-full w-[22%] rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="start-workout"
          className="mx-auto w-[min(1180px,calc(100%-32px))] py-20"
        >
          <div className="reveal relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 px-8 py-20 text-center shadow-2xl shadow-black/30 md:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_38%)] opacity-70 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
                Live workout launch
              </div>

              <h2 className="mx-auto max-w-4xl text-4xl font-semibold md:text-6xl">
                Start the workout experience.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                Launch the live training flow and connect this interface to your
                pose detection, fatigue tracking, and game logic.
              </p>

        <div className="mt-12 flex justify-center">
            <ScrambleButton
            label="START WORKOUT"
            href="#workout-runtime"
        />
    </div>

              <div className="mt-8 text-sm text-white/45">
                Ready for Python detection + fatigue + game integration
              </div>
            </div>
          </div>
        </section>

        <section
          id="stack"
          className="mx-auto w-[min(1180px,calc(100%-32px))] py-16"
        >
          <div className="reveal mb-10 max-w-3xl">
            <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
              Technology
            </div>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Built on a real-time modern stack.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="reveal hover-lift rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
              <p className="text-base leading-7 text-white/68">
                PulseDrive combines frontend motion design, live body analysis,
                and streamed workout data into a system that feels polished
                enough for a real product launch.
              </p>
            </div>

            <div className="reveal rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
              <div className="flex flex-wrap gap-3">
                {TECH.map((item) => (
                  <div
                    key={item}
                    className="tech-pill rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition hover:bg-white/[0.08]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-20">
          <div className="reveal hover-lift rounded-[36px] border border-white/10 bg-white/5 px-8 py-14 text-center shadow-2xl shadow-black/30 md:px-16">
            <div className="mb-3 text-xs uppercase tracking-[0.35em] text-white/45">
              Final impression
            </div>
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold md:text-5xl">
              PulseDrive turns fitness into a responsive digital experience.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68">
              It is more than a tracker. It is a motion-driven system that makes
              effort feel immediate, visual, and worth returning to.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#top"
                className="rounded-full bg-white px-7 py-3 font-semibold text-black transition hover:scale-105"
              >
                Back to top
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ title, text }: FeatureProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xl font-semibold">{title}</div>
      <p className="mt-3 text-base leading-7 text-white/68">{text}</p>
    </div>
  );
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="metric-card rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
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
          frame += .25;
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
      className="start-workout-btn inline-flex min-w-[320px] items-center justify-center rounded-full bg-gradient-to-r from-white via-zinc-200 to-zinc-400 px-12 py-6 text-lg font-semibold tracking-[0.25em] text-black shadow-[0_10px_50px_rgba(255,255,255,0.18)] transition duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.28)] md:min-w-[380px] md:px-16 md:py-7 md:text-xl"
    >
      {label}
    </a>
  );
}