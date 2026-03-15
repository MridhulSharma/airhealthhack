# AIR Health — Pose Detection WebSocket Server
#
# How to run:
#   1. pip install opencv-python mediapipe websockets numpy
#   2. Place pose_landmarker.task in the same directory as this file
#      Download from: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
#   3. python pose_server.py
#   4. In a separate terminal: npm run dev
#
# WebSocket endpoint: ws://localhost:8765
# Payload sent every frame:
#   {
#     landmarks: [{x, y, z, visibility}] x33,
#     repCount: number,
#     repState: 'idle' | 'up' | 'down',
#     elbowAngle: number,
#     formScore: number,
#     timestamp: number
#   }

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]

def draw_landmarks(frame, landmarks):
    h, w = frame.shape[:2]
    points = {}
    for i, lm in enumerate(landmarks):
        cx, cy = int(lm.x * w), int(lm.y * h)
        points[i] = (cx, cy)
        cv2.circle(frame, (cx, cy), 5, (0, 255, 0), -1)
    for a, b in POSE_CONNECTIONS:
        if a in points and b in points:
            cv2.line(frame, points[a], points[b], (0, 180, 255), 2)


def calculate_angle(a, b, c):
    """Calculate angle at point b between vectors ba and bc."""
    a = np.array([a.x, a.y])
    b_pt = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    ba = a - b_pt
    bc = c - b_pt
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0))))


class RepCounter:
    def __init__(self):
        self.rep_count = 0
        self.state = 'idle'   # 'idle' | 'up' | 'down'
        self.last_rep_time = 0
        self.cooldown_ms = 500

    def update(self, landmarks, timestamp_ms):
        """
        Uses LEFT arm: shoulder=11, elbow=13, wrist=15
        Returns: (rep_count, state, angle, form_score)
        """
        if len(landmarks) < 16:
            return self.rep_count, self.state, 0.0, 100

        shoulder = landmarks[11]
        elbow    = landmarks[13]
        wrist    = landmarks[15]

        angle = calculate_angle(shoulder, elbow, wrist)

        prev_state = self.state

        if angle > 160:
            self.state = 'up'
        elif angle < 90:
            self.state = 'down'

        # Count rep on down → up transition with cooldown
        if (prev_state == 'down' and
            self.state == 'up' and
            timestamp_ms - self.last_rep_time > self.cooldown_ms):
            self.rep_count += 1
            self.last_rep_time = timestamp_ms

        # Simple form score: full range = 100, partial = 60
        form_score = 100 if angle < 90 or angle > 160 else 75
        return self.rep_count, self.state, round(angle, 1), form_score


import asyncio
import websockets
import json
import threading

connected_clients = set()
latest_payload = {}

async def ws_handler(websocket):
    """Accept a client and stream pose data until disconnect."""
    connected_clients.add(websocket)
    try:
        async for _ in websocket:
            pass  # we only send, never receive
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)

async def broadcast(payload: dict):
    if connected_clients:
        message = json.dumps(payload)
        await asyncio.gather(
            *[ws.send(message) for ws in connected_clients],
            return_exceptions=True
        )

async def start_ws_server():
    async with websockets.serve(ws_handler, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()  # run forever

def run_pose_detection(loop):
    """Runs in a separate thread. Sends data via the asyncio event loop."""
    base_options = python.BaseOptions(model_asset_path="pose_landmarker.task")
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    counter = RepCounter()
    cap = cv2.VideoCapture(0)

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        print("Pose detection running. Press Q in the OpenCV window to quit.")
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))

            result = landmarker.detect_for_video(mp_image, timestamp_ms)

            landmarks_data = []
            rep_count, state, angle, form_score = 0, 'idle', 0.0, 100

            if result.pose_landmarks:
                for pose in result.pose_landmarks:
                    draw_landmarks(frame, pose)
                    landmarks_data = [
                        {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
                        for lm in pose
                    ]
                    rep_count, state, angle, form_score = counter.update(pose, timestamp_ms)

            payload = {
                "landmarks": landmarks_data,
                "repCount": rep_count,
                "repState": state,
                "elbowAngle": angle,
                "formScore": form_score,
                "timestamp": timestamp_ms
            }

            # Fire and forget into the event loop
            asyncio.run_coroutine_threadsafe(broadcast(payload), loop)

            cv2.imshow("Pose Detection — AIR Health", frame)
            if cv2.waitKey(5) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    # Run pose detection in background thread
    t = threading.Thread(target=run_pose_detection, args=(loop,), daemon=True)
    t.start()
    # Run WebSocket server on main thread event loop
    loop.run_until_complete(start_ws_server())
