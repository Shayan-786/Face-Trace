"""
VideoService — reads an uploaded video, samples frames evenly across
the full timeline, detects and crops the largest face per frame,
runs EfficientNet-B0 inference, and returns aggregated results.

Frame sampling rule
-------------------
  min_frames  = 10
  max_frames  = 30
  one_per_sec = 1 frame every 4 seconds
  actual      = clamp(ceil(duration / 4), min_frames, max_frames)

Face detection
--------------
Uses OpenCV's Haar cascade (frontal face). Falls back to DNN-based
detection is not needed for the prototype; Haar is sufficient and
has no extra model dependency.

If a sampled frame yields no face, it is skipped honestly. If no
frame at all produces a face, a VideoServiceError is raised.
"""

import os
import math
from typing import List, Optional

import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms


class VideoServiceError(Exception):
    """Raised for user-visible pipeline errors (bad video, no faces, etc.)."""


# ---------------------------------------------------------------------------
# ImageNet normalisation (must match training)
# ---------------------------------------------------------------------------
_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

# ---------------------------------------------------------------------------
# Haar cascade (bundled with OpenCV)
# ---------------------------------------------------------------------------
_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
_face_cascade: Optional[object] = None


def _get_cascade():
    """Return the shared Haar cascade classifier, loading it on first call."""
    global _face_cascade
    if _face_cascade is None:
        cascade = cv2.CascadeClassifier(_CASCADE_PATH)
        if cascade.empty():
            raise VideoServiceError(
                "OpenCV Haar cascade could not be loaded. "
                "Check your OpenCV installation."
            )
        _face_cascade = cascade
    return _face_cascade


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sample_timestamps(duration: float) -> List[float]:
    """Return evenly distributed timestamps covering the full timeline."""
    min_f, max_f = 10, 30
    n = max(min_f, min(max_f, math.ceil(duration / 4)))
    if n == 1:
        return [0.0]
    return [duration * i / (n - 1) for i in range(n)]


def _crop_face(frame_bgr: np.ndarray, margin: float = 0.20) -> Optional[np.ndarray]:
    """
    Detect the largest frontal face in a BGR frame.
    Returns an RGB crop with 20 % margin, or None if no face found.
    """
    cascade = _get_cascade()
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60),
    )

    if not isinstance(faces, np.ndarray) or len(faces) == 0:
        return None

    # Largest face by area
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    # Add margin
    ih, iw = frame_bgr.shape[:2]
    mx = int(w * margin)
    my = int(h * margin)
    x1 = max(0, x - mx)
    y1 = max(0, y - my)
    x2 = min(iw, x + w + mx)
    y2 = min(ih, y + h + my)

    crop_bgr = frame_bgr[y1:y2, x1:x2]
    if crop_bgr.size == 0:
        return None

    return cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)


def _frame_at(cap: cv2.VideoCapture, timestamp_sec: float) -> Optional[np.ndarray]:
    """Seek to timestamp and read one frame. Returns None on failure."""
    cap.set(cv2.CAP_PROP_POS_MSEC, timestamp_sec * 1000)
    ok, frame = cap.read()
    return frame if ok else None


def _preprocess(rgb_crop: np.ndarray) -> "torch.Tensor":
    """Convert NumPy HWC RGB to a normalised (1, 3, 224, 224) tensor."""
    pil = Image.fromarray(rgb_crop)
    return _TRANSFORM(pil).unsqueeze(0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class VideoService:
    def analyze(self, video_path: str, model_svc, max_duration: float) -> dict:
        """
        Full pipeline: open → validate → sample → detect → infer → aggregate.

        Parameters
        ----------
        video_path   : absolute path to the temporary video file
        model_svc    : ModelService instance
        max_duration : maximum allowed duration in seconds

        Returns
        -------
        dict matching the Section 6 response schema
        """
        # ── Open ──────────────────────────────────────────────────────────
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise VideoServiceError(
                "The video file could not be opened. It may be corrupt or "
                "encoded in a format OpenCV cannot decode."
            )

        try:
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)

            if fps <= 0 or frame_count <= 0:
                raise VideoServiceError(
                    "Could not read video metadata (FPS or frame count is zero). "
                    "The file may be corrupt."
                )

            duration = frame_count / fps

            # ── Duration check ────────────────────────────────────────────
            if duration > max_duration:
                raise VideoServiceError(
                    f"Video is {duration:.1f}s, which exceeds the "
                    f"{int(max_duration)}s limit."
                )

            # ── Sample timestamps ─────────────────────────────────────────
            timestamps = _sample_timestamps(duration)
            requested = len(timestamps)

            # ── Per-frame processing ──────────────────────────────────────
            all_probs: List[dict] = []
            valid_timestamps: List[float] = []

            for ts in timestamps:
                frame = _frame_at(cap, ts)
                if frame is None:
                    continue

                rgb_crop = _crop_face(frame)
                if rgb_crop is None:
                    continue

                tensor = _preprocess(rgb_crop)
                result = model_svc.predict(tensor)
                all_probs.append(result["probabilities"])
                valid_timestamps.append(round(ts, 2))

            # ── Require at least one valid face ───────────────────────────
            if not all_probs:
                raise VideoServiceError(
                    "No faces were detected in any sampled frame. "
                    "Ensure the video contains a clearly visible frontal face."
                )

            # ── Aggregate across frames ───────────────────────────────────
            from services.model_service import CLASSES
            avg_probs = {
                cls: round(
                    sum(p[cls] for p in all_probs) / len(all_probs), 2
                )
                for cls in CLASSES
            }
            best_class = max(avg_probs, key=lambda c: avg_probs[c])
            confidence = avg_probs[best_class]

            return {
                "status": "completed",
                "video": {
                    "duration_seconds": round(duration, 2),
                    "frames_requested": requested,
                    "frames_analyzed": len(all_probs),
                    "sample_timestamps_seconds": valid_timestamps,
                },
                "visual": {
                    "class_name": best_class,
                    "confidence": confidence,
                    "probabilities": avg_probs,
                },
                "audio": {
                    "status": "not_available",
                    "message": (
                        "Audio analysis is not implemented in the current "
                        "visual-model pipeline."
                    ),
                },
            }

        finally:
            cap.release()
