# AIR Health — Themed Workouts

A gamified workout app that uses real-time pose detection to track exercise reps and drive an interactive themed game scene. Complete pushups to race an F1 car down the track or sail a pirate ship across the ocean — your reps power the world.

## How to Run

```bash
# Install frontend dependencies
npm install

# Start the Next.js dev server
npm run dev

# In a separate terminal, start the pose detection server
pip install opencv-python mediapipe websockets numpy
python pose_server.py
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Animation:** Framer Motion
- **State Management:** Zustand
- **Pose Detection:** MediaPipe Pose Landmarker (via Python + OpenCV)
- **Communication:** WebSocket (Python server → Next.js client)
- **3D (planned):** Three.js, React Three Fiber, Drei

## Themes

- **F1 Race** 🏎️ — Race to the finish line on a scrolling racetrack
- **Pirate Ship** 🏴‍☠️ — Rule the high seas on a sailing voyage

## Note

Part of the AIR Health hackathon Physical Health track.
