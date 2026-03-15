import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

# Pose connections for drawing skeleton
POSE_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,7),
    (0,4),(4,5),(5,6),(6,8),
    (9,10),
    (11,12),(11,13),(13,15),(15,17),(15,19),(15,21),(17,19),
    (12,14),(14,16),(16,18),(16,20),(16,22),(18,20),
    (11,23),(12,24),(23,24),
    (23,25),(25,27),(27,29),(27,31),(29,31),
    (24,26),(26,28),(28,30),(28,32),(30,32),
]

def draw_landmarks(frame, landmarks):
    h, w = frame.shape[:2]
    points = {}

    for i, lm in enumerate(landmarks):
        cx, cy = int(lm.x * w), int(lm.y * h)
        points[i] = (cx, cy)
        cv2.circle(frame, (cx, cy), 5, (0,255,0), -1)

    for a, b in POSE_CONNECTIONS:
        if a in points and b in points:
            cv2.line(frame, points[a], points[b], (0,180,255), 2)

base_options = python.BaseOptions(model_asset_path="pose_landmarker.task")

options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)

cap = cv2.VideoCapture(0)

timestamp_ms = 0   # start timestamp

with vision.PoseLandmarker.create_from_options(options) as landmarker:
    print("Here")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        timestamp_ms += 33   # simulate ~30 FPS timestamps

        result = landmarker.detect_for_video(mp_image, timestamp_ms)

        if result.pose_landmarks:
            for pose in result.pose_landmarks:
                draw_landmarks(frame, pose)

        cv2.imshow("Pose Detection", frame)

        if cv2.waitKey(5) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
