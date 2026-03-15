// Text-to-speech hook for workout feedback.
// Uses Web SpeechSynthesis API with queue and priority support.

import { useCallback, useRef, useEffect } from "react";

interface SpeechOptions {
  priority?: "low" | "normal" | "high";
  rate?: number;
  pitch?: number;
}

export function useSpeech() {
  const speaking = useRef(false);
  const queue = useRef<{ text: string; options: SpeechOptions }[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices (they load async in most browsers)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ??
        voices.find((v) => v.lang.startsWith("en") && v.localService) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
    };
  }, []);

  const processQueue = useCallback(() => {
    if (speaking.current || queue.current.length === 0) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Chrome bug: synthesis can get stuck. Cancel any stale state.
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const next = queue.current.shift()!;
    speaking.current = true;

    const utterance = new SpeechSynthesisUtterance(next.text);
    utterance.rate = next.options.rate ?? 1.1;
    utterance.pitch = next.options.pitch ?? 1.0;
    utterance.volume = 1.0;

    if (voiceRef.current) utterance.voice = voiceRef.current;

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
