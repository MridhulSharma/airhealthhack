import asyncio
import json
import threading
import websockets
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from collections import deque
import queue
from http.server import BaseHTTPRequestHandler, HTTPServer

# Global frame queue for MJPEG stream
frame_queue = queue.Queue(maxsize=2)

class MJPEGHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress HTTP logs

    def do_GET(self):
        if self.path == '/video':
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                while True:
                    try:
                        frame = frame_queue.get(timeout=1.0)
                        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
                        self.wfile.write(b'--frame\r\n')
                        self.wfile.write(b'Content-Type: image/jpeg\r\n\r\n')
                        self.wfile.write(jpeg.tobytes())
                        self.wfile.write(b'\r\n')
                    except queue.Empty:
                        continue
            except:
                pass
        else:
            self.send_response(404)
            self.end_headers()

def run_mjpeg_server():
    server = HTTPServer(('localhost', 8766), MJPEGHandler)
    server.serve_forever()

# ── Constants ─────────────────────────────────────────────────────────────────
WS_PORT       = 8765
CALIB_REPS    = 2
LENIENCY      = 1.10
JITTER_FRAMES = 8

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

def angle_at(a, b, c):
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos, -1, 1))))

def lm_px(lm, w, h):
    return int(lm.x * w), int(lm.y * h)

# ── CurlAnalyzer (from fatigue.py — full implementation) ──────────────────────
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
        self.rep_min_l = self.rep_min_r = 999
        self.rep_max_l = self.rep_max_r = 0
        self.calib_done = False
        self._c_min_l = []; self._c_min_r = []
        self._c_max_l = []; self._c_max_r = []
        self._c_ecc_vel_l = []; self._c_ecc_vel_r = []
        self._c_jitter_l = []; self._c_jitter_r = []
        self._c_asym = []
        self._c_wrist_l_x = []; self._c_wrist_r_x = []
        self.thresh = {}
        self.active_flags  = set()
        self.active_issues = []
        self.last_rom_issues = []
        self.prev_al = None
        self.prev_ar = None
        self.prev_ts = None

    def _collect_calib_frame(self, al, ar, wl, wr, dt):
        if len(self.wrist_l_hist) == JITTER_FRAMES:
            self._c_jitter_l.append(np.std([p[0] for p in self.wrist_l_hist]) + np.std([p[1] for p in self.wrist_l_hist]))
        if len(self.wrist_r_hist) == JITTER_FRAMES:
            self._c_jitter_r.append(np.std([p[0] for p in self.wrist_r_hist]) + np.std([p[1] for p in self.wrist_r_hist]))
        if self.phase == "down" and self.prev_al is not None:
            vel_l = (al - self.prev_al) / dt
            vel_r = (ar - self.prev_ar) / dt
            if vel_l > 0: self._c_ecc_vel_l.append(vel_l)
            if vel_r > 0: self._c_ecc_vel_r.append(vel_r)
        avg = (al + ar) / 2
        if avg < 120:
            self._c_asym.append(abs(al - ar))
        self._c_wrist_l_x.append(wl[0])
        self._c_wrist_r_x.append(wr[0])

    def _collect_rep_calib(self):
        self._c_min_l.append(self.rep_min_l)
        self._c_min_r.append(self.rep_min_r)
        self._c_max_l.append(self.rep_max_l)
        self._c_max_r.append(self.rep_max_r)

    def _finalise_calibration(self):
        L = LENIENCY
        self.thresh = {
            "rom_top_l":   np.mean(self._c_min_l) * L,
            "rom_top_r":   np.mean(self._c_min_r) * L,
            "rom_bot_l":   np.mean(self._c_max_l) / L,
            "rom_bot_r":   np.mean(self._c_max_r) / L,
            "ecc_vel_l":   (np.mean(self._c_ecc_vel_l) * L) if self._c_ecc_vel_l else 150,
            "ecc_vel_r":   (np.mean(self._c_ecc_vel_r) * L) if self._c_ecc_vel_r else 150,
            "jitter_l":    (np.mean(self._c_jitter_l) * L) if self._c_jitter_l else 12,
            "jitter_r":    (np.mean(self._c_jitter_r) * L) if self._c_jitter_r else 12,
            "asymmetry":   (np.mean(self._c_asym) * L) if self._c_asym else 22,
            "path_dev_l":  (np.std(self._c_wrist_l_x) * L) if self._c_wrist_l_x else 40,
            "path_dev_r":  (np.std(self._c_wrist_r_x) * L) if self._c_wrist_r_x else 40,
            "path_base_l": np.mean(self._c_wrist_l_x),
            "path_base_r": np.mean(self._c_wrist_r_x),
        }
        self.calib_done = True
        print("Calibration complete:", self.thresh)

    def _reset_rep(self):
        self.rep_min_l = self.rep_min_r = 999
        self.rep_max_l = self.rep_max_r = 0
        self.ecc_fast_l = self.ecc_fast_r = 0

    def form_score(self):
        """Convert active issues to a 0-100 score for the game."""
        all_issues = self.active_issues + self.last_rom_issues
        return max(0, 100 - len(all_issues) * 20)

    def update(self, lms, w, h, ts_sec):
        sl = lm_px(lms[L_SHOULDER], w, h); el = lm_px(lms[L_ELBOW], w, h); wl = lm_px(lms[L_WRIST], w, h)
        sr = lm_px(lms[R_SHOULDER], w, h); er = lm_px(lms[R_ELBOW], w, h); wr = lm_px(lms[R_WRIST], w, h)
        al = angle_at(sl, el, wl)
        ar = angle_at(sr, er, wr)
        avg = (al + ar) / 2
        dt = max((ts_sec - self.prev_ts) if self.prev_ts else 0.033, 0.001)
        self.angle_l_hist.append(al); self.angle_r_hist.append(ar)
        self.wrist_l_hist.append(wl); self.wrist_r_hist.append(wr)
        self.rep_min_l = min(self.rep_min_l, al); self.rep_min_r = min(self.rep_min_r, ar)
        self.rep_max_l = max(self.rep_max_l, al); self.rep_max_r = max(self.rep_max_r, ar)
        if not self.calib_done:
            self._collect_calib_frame(al, ar, wl, wr, dt)
        rom_top = self.thresh.get("rom_top_l", 70)
        rom_bot = self.thresh.get("rom_bot_l", 150)
        if self.phase == "down" and avg < rom_top:
            self.phase = "up"; self.in_rep = True
        elif self.phase == "up" and avg > rom_bot:
            self.phase = "down"; self.reps += 1
            if self.reps <= CALIB_REPS:
                self._collect_rep_calib()
            if self.reps == CALIB_REPS and not self.calib_done:
                self._finalise_calibration()
            self.last_rom_issues = []
            if self.calib_done:
                t = self.thresh
                if self.rep_min_l > t["rom_top_l"]: self.last_rom_issues.append(("Curl higher (L)", LEFT_ARM))
                if self.rep_min_r > t["rom_top_r"]: self.last_rom_issues.append(("Curl higher (R)", RIGHT_ARM))
                if self.rep_max_l < t["rom_bot_l"]: self.last_rom_issues.append(("Extend fully (L)", LEFT_ARM))
                if self.rep_max_r < t["rom_bot_r"]: self.last_rom_issues.append(("Extend fully (R)", RIGHT_ARM))
            self.active_flags = set(); self.active_issues = []
            self._reset_rep()
        live_flags = set(); live_issues = []
        if self.in_rep and self.calib_done:
            t = self.thresh
            if self.phase == "down" and self.prev_al is not None:
                vel_l = (al - self.prev_al) / dt; vel_r = (ar - self.prev_ar) / dt
                self.ecc_fast_l = self.ecc_fast_l + 1 if vel_l > t["ecc_vel_l"] else 0
                self.ecc_fast_r = self.ecc_fast_r + 1 if vel_r > t["ecc_vel_r"] else 0
                if self.ecc_fast_l >= 4: live_issues.append(("Slow down (L)", LEFT_ARM)); live_flags |= LEFT_ARM
                if self.ecc_fast_r >= 4: live_issues.append(("Slow down (R)", RIGHT_ARM)); live_flags |= RIGHT_ARM
            if len(self.wrist_l_hist) == JITTER_FRAMES:
                if (np.std([p[0] for p in self.wrist_l_hist]) + np.std([p[1] for p in self.wrist_l_hist])) > t["jitter_l"]:
                    live_issues.append(("Steady the arm (L)", LEFT_ARM)); live_flags |= LEFT_ARM
            if len(self.wrist_r_hist) == JITTER_FRAMES:
                if (np.std([p[0] for p in self.wrist_r_hist]) + np.std([p[1] for p in self.wrist_r_hist])) > t["jitter_r"]:
                    live_issues.append(("Steady the arm (R)", RIGHT_ARM)); live_flags |= RIGHT_ARM
            if avg < 120 and abs(al - ar) > t["asymmetry"]:
                live_issues.append((f"Uneven {abs(al-ar):.0f}°", LEFT_ARM | RIGHT_ARM)); live_flags |= LEFT_ARM | RIGHT_ARM
            dev_l = abs(wl[0] - t["path_base_l"]); dev_r = abs(wr[0] - t["path_base_r"])
            if dev_l > t["path_dev_l"]: live_issues.append(("Wrist path off (L)", LEFT_ARM)); live_flags |= LEFT_ARM
            if dev_r > t["path_dev_r"]: live_issues.append(("Wrist path off (R)", RIGHT_ARM)); live_flags |= RIGHT_ARM
        self.active_flags = live_flags; self.active_issues = live_issues
        self.prev_al = al; self.prev_ar = ar; self.prev_ts = ts_sec
        return al, ar

# ── WebSocket broadcast ───────────────────────────────────────────────────────
connected_clients = set()
latest_payload = {}

async def ws_handler(websocket):
    connected_clients.add(websocket)
    print(f"Client connected. Total: {len(connected_clients)}")
    try:
        async for _ in websocket:
            pass
    except:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"Client disconnected. Total: {len(connected_clients)}")

async def broadcast(payload):
    if not connected_clients:
        return
    msg = json.dumps(payload)
    await asyncio.gather(*[c.send(msg) for c in connected_clients], return_exceptions=True)

def run_pose_detection(loop):
    base_options = python.BaseOptions(model_asset_path="pose_landmarker.task")
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    cap = cv2.VideoCapture(0)
    analyzer = CurlAnalyzer()

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        print(f"Pose server running — ws://localhost:{WS_PORT}")
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
            result = landmarker.detect_for_video(mp_image, ts_ms)

            al, ar = 180.0, 180.0
            landmarks_data = []
            repState = "idle"

            if result.pose_landmarks:
                pose = result.pose_landmarks[0]
                al, ar = analyzer.update(pose, frame.shape[1], frame.shape[0], ts_ms / 1000.0)
                repState = analyzer.phase
                landmarks_data = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in pose]

                # Draw skeleton on OpenCV window
                h, w = frame.shape[:2]
                pts = {i: (int(lm.x * w), int(lm.y * h)) for i, lm in enumerate(pose)}
                for a, b in POSE_CONNECTIONS:
                    if a in pts and b in pts:
                        bad = a in analyzer.active_flags or b in analyzer.active_flags
                        cv2.line(frame, pts[a], pts[b], (40,40,255) if bad else (80,220,100), 2)
                for i, pt in pts.items():
                    cv2.circle(frame, pt, 5, (40,40,255) if i in analyzer.active_flags else (80,220,100), -1)

            # Build all form issue messages for the HUD
            all_issues = [msg for msg, _ in analyzer.active_issues + analyzer.last_rom_issues]

            payload = {
                "repCount":     analyzer.reps,
                "formScore":    analyzer.form_score(),
                "elbowAngle":   round((al + ar) / 2, 1),
                "elbowAngleL":  round(al, 1),
                "elbowAngleR":  round(ar, 1),
                "repState":     repState,
                "landmarks":    landmarks_data,
                "timestamp":    ts_ms,
                "calibrating":  not analyzer.calib_done,
                "calibReps":    min(analyzer.reps, CALIB_REPS),
                "fatigueIssues": all_issues,
            }

            asyncio.run_coroutine_threadsafe(broadcast(payload), loop)

            # OpenCV HUD
            cv2.putText(frame, f"Reps: {analyzer.reps}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)
            cv2.putText(frame, f"Form: {analyzer.form_score()}%", (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (80,220,100), 2)
            cv2.putText(frame, f"Clients: {len(connected_clients)}", (10, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180,180,180), 1)
            if not analyzer.calib_done:
                cv2.putText(frame, f"Calibrating {analyzer.reps}/{CALIB_REPS}...", (10, 125), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (80,200,255), 1)
            for i, msg in enumerate(all_issues[:3]):
                cv2.putText(frame, msg, (10, 155 + i*28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40,40,255), 2)

            # Push annotated frame to MJPEG stream (drop if full)
            try:
                frame_queue.put_nowait(frame.copy())
            except queue.Full:
                pass

    cap.release()

async def start_ws_server():
    async with websockets.serve(ws_handler, "localhost", WS_PORT):
        print(f"WebSocket server started on ws://localhost:{WS_PORT}")
        await asyncio.Future()

if __name__ == "__main__":
    # Start MJPEG HTTP server on port 8766
    mjpeg_thread = threading.Thread(target=run_mjpeg_server, daemon=True)
    mjpeg_thread.start()
    print("Camera stream available at http://localhost:8766/video")

    loop = asyncio.new_event_loop()
    thread = threading.Thread(target=run_pose_detection, args=(loop,), daemon=True)
    thread.start()
    loop.run_until_complete(start_ws_server())
