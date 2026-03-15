import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from collections import deque

# ── Fixed constants (not calibrated) ─────────────────────────────────────────
CALIB_REPS     = 2
LENIENCY       = 1.10
JITTER_FRAMES  = 8

# ── Landmark indices ──────────────────────────────────────────────────────────
L_SHOULDER, L_ELBOW, L_WRIST = 11, 13, 15
R_SHOULDER, R_ELBOW, R_WRIST = 12, 14, 16
LEFT_ARM  = {11, 13, 15}
RIGHT_ARM = {12, 14, 16}

POSE_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,7),(0,4),(4,5),(5,6),(6,8),(9,10),
    (11,12),(11,13),(13,15),(15,17),(15,19),(15,21),(17,19),
    (12,14),(14,16),(16,18),(16,20),(16,22),(18,20),
    (11,23),(12,24),(23,24),
    (23,25),(25,27),(27,29),(27,31),(29,31),
    (24,26),(26,28),(28,30),(28,32),(30,32),
]

COL_GOOD    = (80,220,100)
COL_BAD     = (40,40,255)
COL_NEUTRAL = (180,180,180)
COL_WHITE   = (255,255,255)
COL_DIM     = (120,120,120)


def angle_at(a, b, c):
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos, -1, 1))))


def lm_px(lm, w, h):
    return int(lm.x * w), int(lm.y * h)


class CurlAnalyzer:

    def __init__(self):
        self.reps   = 0
        self.phase  = "down"
        self.in_rep = False

        self.angle_l_hist = deque(maxlen=JITTER_FRAMES)
        self.angle_r_hist = deque(maxlen=JITTER_FRAMES)
        self.wrist_l_hist = deque(maxlen=JITTER_FRAMES)
        self.wrist_r_hist = deque(maxlen=JITTER_FRAMES)

        self.ecc_fast_l = 0
        self.ecc_fast_r = 0

        self.rep_min_l = 999
        self.rep_min_r = 999
        self.rep_max_l = 0
        self.rep_max_r = 0

        self.prev_al = None
        self.prev_ar = None
        self.prev_ts = None


    def _reset_rep(self):
        self.rep_min_l = self.rep_min_r = 999
        self.rep_max_l = self.rep_max_r = 0
        self.ecc_fast_l = self.ecc_fast_r = 0


    def update(self, lms, w, h, ts_sec):

        sl = lm_px(lms[L_SHOULDER], w, h)
        el = lm_px(lms[L_ELBOW], w, h)
        wl = lm_px(lms[L_WRIST], w, h)

        sr = lm_px(lms[R_SHOULDER], w, h)
        er = lm_px(lms[R_ELBOW], w, h)
        wr = lm_px(lms[R_WRIST], w, h)

        al = angle_at(sl, el, wl)
        ar = angle_at(sr, er, wr)

        avg = (al + ar) / 2

        dt = max((ts_sec - self.prev_ts) if self.prev_ts else 0.033, 0.001)

        self.angle_l_hist.append(al)
        self.angle_r_hist.append(ar)

        self.wrist_l_hist.append(wl)
        self.wrist_r_hist.append(wr)

        self.rep_min_l = min(self.rep_min_l, al)
        self.rep_min_r = min(self.rep_min_r, ar)
        self.rep_max_l = max(self.rep_max_l, al)
        self.rep_max_r = max(self.rep_max_r, ar)

        rom_top = 70
        rom_bot = 150

        if self.phase == "down" and avg < rom_top:
            self.phase = "up"
            self.in_rep = True

        elif self.phase == "up" and avg > rom_bot:
            self.phase = "down"
            self.reps += 1
            self._reset_rep()

        self.prev_al = al
        self.prev_ar = ar
        self.prev_ts = ts_sec

        return al, ar


def draw_skeleton(frame, landmarks):

    h, w = frame.shape[:2]

    pts = {}
    for i, lm in enumerate(landmarks):
        pts[i] = (int(lm.x * w), int(lm.y * h))

    for a, b in POSE_CONNECTIONS:
        if a in pts and b in pts:
            cv2.line(frame, pts[a], pts[b], COL_GOOD, 2)

    for pt in pts.values():
        cv2.circle(frame, pt, 5, COL_GOOD, -1)


def draw_hud(frame, analyzer, al, ar):

    h, w = frame.shape[:2]

    rep_text = str(analyzer.reps)
    cv2.putText(frame, rep_text, (w//2-40,80),
                cv2.FONT_HERSHEY_SIMPLEX,2.8,COL_WHITE,4)

    phase_text = "CURLING" if analyzer.phase=="up" else "LOWERING"
    cv2.putText(frame, phase_text, (w//2-70,120),
                cv2.FONT_HERSHEY_SIMPLEX,0.6,COL_GOOD,2)


# ── Main loop ────────────────────────────────────────────────────────────────

base_options = python.BaseOptions(model_asset_path="pose_landmarker.task")

options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)

cap = cv2.VideoCapture(0)

analyzer = CurlAnalyzer()

ts_ms = 0

with vision.PoseLandmarker.create_from_options(options) as landmarker:

    while cap.isOpened():

        ret, frame = cap.read()

        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        ts_ms += 33

        result = landmarker.detect_for_video(mp_image, ts_ms)

        al, ar = 180.0, 180.0

        if result.pose_landmarks:

            pose = result.pose_landmarks[0]

            al, ar = analyzer.update(
                pose,
                frame.shape[1],
                frame.shape[0],
                ts_ms / 1000.0
            )

            draw_skeleton(frame, pose)

        draw_hud(frame, analyzer, al, ar)

        cv2.imshow("Curl Tracker", frame)

        if cv2.waitKey(5) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()
