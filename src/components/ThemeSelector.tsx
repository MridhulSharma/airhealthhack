"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGameStore } from "@/game/GameState";

const themes = [
  { id: "f1" as const, emoji: "🏎️", title: "F1 Race", description: "Race to the finish line" },
  { id: "pirate" as const, emoji: "🏴‍☠️", title: "Pirate Ship", description: "Rule the high seas" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ThemeSelector() {
  const setTheme = useGameStore((s) => s.setTheme);
  const router = useRouter();

  const handleSelect = (id: "f1" | "pirate") => {
    setTheme(id);
    router.push("/workout");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-5xl font-bold text-white"
      >
        Choose Your Arena
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-12 text-lg text-gray-400"
      >
        Your reps power the world
      </motion.p>

      <motion.div
        className="flex flex-row gap-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            variants={item}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => handleSelect(theme.id)}
            className="flex cursor-pointer flex-col items-center rounded-2xl bg-zinc-900 p-8 border border-transparent hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span className="text-8xl">{theme.emoji}</span>
            <h2 className="mt-4 text-2xl font-bold text-white">{theme.title}</h2>
            <p className="mt-2 text-gray-400">{theme.description}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
