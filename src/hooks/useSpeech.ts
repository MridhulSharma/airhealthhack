// Text-to-speech hook for workout feedback.
// Uses Web SpeechSynthesis API with queue and priority support.

import { useCallback, useRef } from "react";

interface SpeechOptions {
  priority?: "low" | "normal" | "high";
  rate?: number;
  pitch?: number;
}

export function useSpeech() {
  const speaking = useRef(false);
  const queue = useRef<{ text: string; options: SpeechOptions }[]>([]);

  const processQueue = useCallback(() => {
    if (speaking.current || queue.current.length === 0) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const next = queue.current.shift()!;
    speaking.current = true;

    const utterance = new SpeechSynthesisUtterance(next.text);
    utterance.rate = next.options.rate ?? 1.1;
    utterance.pitch = next.options.pitch ?? 1.0;
    utterance.volume = 1.0;

    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      speaking.current = false;
      processQueue();
    };
    utterance.onerror = () => {
      speaking.current = false;
      processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // High priority: cancel current speech and jump to front
      if (options.priority === "high") {
        window.speechSynthesis.cancel();
        speaking.current = false;
        queue.current.unshift({ text, options });
      } else {
        queue.current.push({ text, options });
      }

      processQueue();
    },
    [processQueue]
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    queue.current = [];
    speaking.current = false;
  }, []);

  return { speak, cancel };
}
