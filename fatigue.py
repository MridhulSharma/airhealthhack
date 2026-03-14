import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from collections import deque

# ── Fixed constants (not calibrated) ─────────────────────────────────────────
CALIB_REPS     = 2
LENIENCY       = 1.10      # 10% leniency multiplier applied to all calibrated thresholds
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

COL_GOOD    = (80, 220, 100)
COL_BAD     = (40,  40, 255)
COL_NEUTRAL = (180, 180, 180)
COL_WHITE   = (255, 255, 255)
COL_DIM     = (120, 120, 120)


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

        # Per-frame history
        self.angle_l_hist = deque(maxlen=JITTER_FRAMES)
        self.angle_r_hist = deque(maxlen=JITTER_FRAMES)
        self.wrist_l_hist = deque(maxlen=JITTER_FRAMES)
        self.wrist_r_hist = deque(maxlen=JITTER_FRAMES)

        # Eccentric consecutive fast-frame counters
        self.ecc_fast_l = 0
        self.ecc_fast_r = 0

        # Per-rep tracking
        self.rep_min_l = 999
        self.rep_min_r = 999
        self.rep_max_l = 0
        self.rep_max_r = 0

        # ── Calibration accumulators ──────────────────────────────────────────
        self.calib_done = False

        # Raw per-frame values collected during calib reps
        self._c_min_l   = []   # top-of-curl angles (min per rep)
        self._c_min_r   = []
        self._c_max_l   = []   # bottom-of-curl angles (max per rep)
        self._c_max_r   = []
        self._c_ecc_vel_l = []  # eccentric velocities observed
        self._c_ecc_vel_r = []
        self._c_jitter_l  = []  # per-frame jitter values
        self._c_jitter_r  = []
        self._c_asym      = []  # asymmetry values during mid-curl
        self._c_wrist_l_x = []  # wrist x positions for path baseline
        self._c_wrist_r_x = []

        # ── Calibrated thresholds (set after CALIB_REPS) ─────────────────────
        self.thresh = {}        # populated in _finalise_calibration()

        # Output flags
        self.active_flags  = set()
        self.active_issues = []
        self.last_rom_issues = []

        # Previous frame values
        self.prev_al = None
        self.prev_ar = None
        self.prev_ts = None

    # ── Calibration ───────────────────────────────────────────────────────────
    def _collect_calib_frame(self, al, ar, wl, wr, dt):
        """Accumulate raw values during the calibration reps."""
        # Jitter
        if len(self.wrist_l_hist) == JITTER_FRAMES:
            self._c_jitter_l.append(
                np.std([p[0] for p in self.wrist_l_hist]) +
                np.std([p[1] for p in self.wrist_l_hist])
            )
        if len(self.wrist_r_hist) == JITTER_FRAMES:
            self._c_jitter_r.append(
                np.std([p[0] for p in self.wrist_r_hist]) +
                np.std([p[1] for p in self.wrist_r_hist])
            )

        # Eccentric velocity (lowering phase)
        if self.phase == "down" and self.prev_al is not None:
            vel_l = (al - self.prev_al) / dt
            vel_r = (ar - self.prev_ar) / dt
            if vel_l > 0: self._c_ecc_vel_l.append(vel_l)
            if vel_r > 0: self._c_ecc_vel_r.append(vel_r)

        # Asymmetry during mid-curl
        avg = (al + ar) / 2
        if avg < 120:
            self._c_asym.append(abs(al - ar))

        # Wrist path x positions
        self._c_wrist_l_x.append(wl[0])
        self._c_wrist_r_x.append(wr[0])

    def _collect_rep_calib(self):
        """Called at end of each calib rep to store per-rep min/max."""
        self._c_min_l.append(self.rep_min_l)
        self._c_min_r.append(self.rep_min_r)
        self._c_max_l.append(self.rep_max_l)
        self._c_max_r.append(self.rep_max_r)

    def _finalise_calibration(self):
        """Compute thresholds from calibration data + 10% leniency."""
        L = LENIENCY

        # ROM: use the mean of the calib reps as the expected range,
        # then allow LENIENCY% slack in each direction.
        rom_top_l  = np.mean(self._c_min_l) * L   # allow angle to be L% higher
        rom_top_r  = np.mean(self._c_min_r) * L
        rom_bot_l  = np.mean(self._c_max_l) / L   # allow angle to be L% lower
        rom_bot_r  = np.mean(self._c_max_r) / L

        # Eccentric velocity: mean observed peak + 10%
        ecc_l = (np.mean(self._c_ecc_vel_l) * L) if self._c_ecc_vel_l else 150
        ecc_r = (np.mean(self._c_ecc_vel_r) * L) if self._c_ecc_vel_r else 150

        # Jitter: mean observed + 10%
        jit_l = (np.mean(self._c_jitter_l) * L) if self._c_jitter_l else 12
        jit_r = (np.mean(self._c_jitter_r) * L) if self._c_jitter_r else 12

        # Asymmetry: mean observed + 10%
        asym = (np.mean(self._c_asym) * L) if self._c_asym else 22

        # Path deviation: std-dev of wrist x during calib * L as allowed spread
        path_l = (np.std(self._c_wrist_l_x) * L) if self._c_wrist_l_x else 40
        path_r = (np.std(self._c_wrist_r_x) * L) if self._c_wrist_r_x else 40

        # Baseline wrist x (mean position)
        path_base_l = np.mean(self._c_wrist_l_x)
        path_base_r = np.mean(self._c_wrist_r_x)

        self.thresh = {
            "rom_top_l":   rom_top_l,   # max allowed top angle (L)
            "rom_top_r":   rom_top_r,
            "rom_bot_l":   rom_bot_l,   # min allowed bottom angle (L)
            "rom_bot_r":   rom_bot_r,
            "ecc_vel_l":   ecc_l,
            "ecc_vel_r":   ecc_r,
            "jitter_l":    jit_l,
            "jitter_r":    jit_r,
            "asymmetry":   asym,
            "path_dev_l":  path_l,
            "path_dev_r":  path_r,
            "path_base_l": path_base_l,
            "path_base_r": path_base_r,
        }
        self.calib_done = True

        print("\n── Calibrated thresholds (with 10% leniency) ──")
        for k, v in self.thresh.items():
            print(f"  {k:15s}: {v:.2f}")

    def _reset_rep(self):
        self.rep_min_l = self.rep_min_r = 999
        self.rep_max_l = self.rep_max_r = 0
        self.ecc_fast_l = self.ecc_fast_r = 0

    # ── Main update ───────────────────────────────────────────────────────────
    def update(self, lms, w, h, ts_sec):
        sl = lm_px(lms[L_SHOULDER], w, h)
        el = lm_px(lms[L_ELBOW],    w, h)
        wl = lm_px(lms[L_WRIST],    w, h)
        sr = lm_px(lms[R_SHOULDER], w, h)
        er = lm_px(lms[R_ELBOW],    w, h)
        wr = lm_px(lms[R_WRIST],    w, h)

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

        # Collect calib data every frame during calib reps
        if not self.calib_done:
            self._collect_calib_frame(al, ar, wl, wr, dt)

        # Use fallback thresholds before calibration is done
        rom_top  = self.thresh.get("rom_top_l",  70)
        rom_bot  = self.thresh.get("rom_bot_l", 150)

        # ── Phase / rep detection ─────────────────────────────────────────────
        if self.phase == "down" and avg < rom_top:
            self.phase  = "up"
            self.in_rep = True

        elif self.phase == "up" and avg > rom_bot:
            self.phase = "down"
            self.reps += 1

            # Collect calib rep data before finalising
            if self.reps <= CALIB_REPS:
                self._collect_rep_calib()
            if self.reps == CALIB_REPS and not self.calib_done:
                self._finalise_calibration()

            # ROM check (only after calibration)
            self.last_rom_issues = []
            if self.calib_done:
                t = self.thresh
                if self.rep_min_l > t["rom_top_l"]:
                    self.last_rom_issues.append(("Curl higher (L)", LEFT_ARM))
                if self.rep_min_r > t["rom_top_r"]:
                    self.last_rom_issues.append(("Curl higher (R)", RIGHT_ARM))
                if self.rep_max_l < t["rom_bot_l"]:
                    self.last_rom_issues.append(("Extend fully (L)", LEFT_ARM))
                if self.rep_max_r < t["rom_bot_r"]:
                    self.last_rom_issues.append(("Extend fully (R)", RIGHT_ARM))

            self.active_flags  = set()
            self.active_issues = []
            self._reset_rep()

        # ── Live checks (only after calibration, during active rep) ──────────
        live_flags  = set()
        live_issues = []

        if self.in_rep and self.calib_done:
            t = self.thresh

            # Eccentric velocity
            if self.phase == "down" and self.prev_al is not None:
                vel_l = (al - self.prev_al) / dt
                vel_r = (ar - self.prev_ar) / dt
                self.ecc_fast_l = self.ecc_fast_l + 1 if vel_l > t["ecc_vel_l"] else 0
                self.ecc_fast_r = self.ecc_fast_r + 1 if vel_r > t["ecc_vel_r"] else 0
                if self.ecc_fast_l >= 4:
                    live_issues.append(("Slow down (L)", LEFT_ARM))
                    live_flags |= LEFT_ARM
                if self.ecc_fast_r >= 4:
                    live_issues.append(("Slow down (R)", RIGHT_ARM))
                    live_flags |= RIGHT_ARM

            # Jitter
            if len(self.wrist_l_hist) == JITTER_FRAMES:
                jitter_l = np.std([p[0] for p in self.wrist_l_hist]) + \
                           np.std([p[1] for p in self.wrist_l_hist])
                if jitter_l > t["jitter_l"]:
                    live_issues.append(("Steady the arm (L)", LEFT_ARM))
                    live_flags |= LEFT_ARM

            if len(self.wrist_r_hist) == JITTER_FRAMES:
                jitter_r = np.std([p[0] for p in self.wrist_r_hist]) + \
                           np.std([p[1] for p in self.wrist_r_hist])
                if jitter_r > t["jitter_r"]:
                    live_issues.append(("Steady the arm (R)", RIGHT_ARM))
                    live_flags |= RIGHT_ARM

            # Asymmetry
            if avg < 120 and abs(al - ar) > t["asymmetry"]:
                live_issues.append((f"Uneven {abs(al-ar):.0f}°", LEFT_ARM | RIGHT_ARM))
                live_flags |= LEFT_ARM | RIGHT_ARM

            # Path deviation
            dev_l = abs(wl[0] - t["path_base_l"])
            dev_r = abs(wr[0] - t["path_base_r"])
            if dev_l > t["path_dev_l"]:
                live_issues.append(("Wrist path off (L)", LEFT_ARM))
                live_flags |= LEFT_ARM
            if dev_r > t["path_dev_r"]:
                live_issues.append(("Wrist path off (R)", RIGHT_ARM))
                live_flags |= RIGHT_ARM

        self.active_flags  = live_flags
        self.active_issues = live_issues

        self.prev_al = al
        self.prev_ar = ar
        self.prev_ts = ts_sec

        return al, ar


# ── Drawing ───────────────────────────────────────────────────────────────────
def draw_skeleton(frame, landmarks, bad_landmarks):
    h, w = frame.shape[:2]
    pts = {}
    for i, lm in enumerate(landmarks):
        pts[i] = (int(lm.x * w), int(lm.y * h))

    for a, b in POSE_CONNECTIONS:
        if a in pts and b in pts:
            bad   = a in bad_landmarks or b in bad_landmarks
            col   = COL_BAD if bad else COL_GOOD
            thick = 3 if bad else 2
            cv2.line(frame, pts[a], pts[b], col, thick)

    for i, pt in pts.items():
        bad = i in bad_landmarks
        col = COL_BAD if bad else COL_GOOD
        cv2.circle(frame, pt, 5, col, -1)
        if bad:
            cv2.circle(frame, pt, 8, COL_BAD, 2)


def draw_hud(frame, analyzer, al, ar):
    h, w = frame.shape[:2]
    in_calib = not analyzer.calib_done

    # Rep counter
    rep_text = str(analyzer.reps)
    ts = 2.8
    tx, ty = w // 2, 80
    cv2.putText(frame, rep_text,
                (tx - cv2.getTextSize(rep_text, cv2.FONT_HERSHEY_SIMPLEX, ts, 4)[0][0] // 2, ty),
                cv2.FONT_HERSHEY_SIMPLEX, ts, COL_WHITE, 4, cv2.LINE_AA)
    label = "REPS"
    lw = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)[0][0]
    cv2.putText(frame, label, (tx - lw // 2, ty + 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, COL_DIM, 1, cv2.LINE_AA)

    # Phase indicator
    phase_text = "▲ CURLING" if analyzer.phase == "up" else "▼ LOWERING"
    phase_col  = COL_GOOD if analyzer.phase == "up" else (100, 180, 255)
    pw = cv2.getTextSize(phase_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0][0]
    cv2.putText(frame, phase_text, (tx - pw // 2, ty + 46),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, phase_col, 1, cv2.LINE_AA)

    # Calibration notice
    if in_calib:
        msg = f"Calibrating... {analyzer.reps}/{CALIB_REPS} reps"
        mw = cv2.getTextSize(msg, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)[0][0]
        cv2.putText(frame, msg, (tx - mw // 2, ty + 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (80, 200, 255), 1, cv2.LINE_AA)

    # Angle bars
    for side, ang, x_off in [("L", al, 30), ("R", ar, w - 110)]:
        bar_h  = 80
        filled = int(bar_h * (1 - ang / 180))
        cv2.rectangle(frame, (x_off, h - 110), (x_off + 18, h - 30), COL_DIM, 1)
        cv2.rectangle(frame, (x_off, h - 30 - filled), (x_off + 18, h - 30), COL_GOOD, -1)
        cv2.putText(frame, f"{ang:.0f}°", (x_off - 4, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, COL_DIM, 1, cv2.LINE_AA)
        cv2.putText(frame, side, (x_off + 4, h - 118),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, COL_DIM, 1, cv2.LINE_AA)

    # Form issues
    all_issues = analyzer.active_issues + analyzer.last_rom_issues
    for i, (msg, _) in enumerate(all_issues[:3]):
        iy = h - 30 - i * 30
        iw = cv2.getTextSize(msg, cv2.FONT_HERSHEY_SIMPLEX, 0.62, 2)[0][0]
        cv2.rectangle(frame, (tx - iw // 2 - 8, iy - 20),
                      (tx + iw // 2 + 8, iy + 4), (0, 0, 0), -1)
        cv2.putText(frame, msg, (tx - iw // 2, iy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.62, COL_BAD, 2, cv2.LINE_AA)


# ── Main loop ─────────────────────────────────────────────────────────────────
base_options = python.BaseOptions(model_asset_path="pose_landmarker.task")
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)

cap      = cv2.VideoCapture(0)
analyzer = CurlAnalyzer()

with vision.PoseLandmarker.create_from_options(options) as landmarker:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        ts_ms    = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        result   = landmarker.detect_for_video(mp_image, ts_ms)

        al, ar = 180.0, 180.0
        if result.pose_landmarks:
            pose   = result.pose_landmarks[0]
            al, ar = analyzer.update(pose, frame.shape[1], frame.shape[0], ts_ms / 1000.0)
            draw_skeleton(frame, pose, analyzer.active_flags)

        draw_hud(frame, analyzer, al, ar)

        cv2.imshow("Curl Tracker", frame)
        if cv2.waitKey(5) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()