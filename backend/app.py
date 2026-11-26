"""
Face Trace — Flask visual analysis API.

Endpoints
---------
GET  /api/health   — model load status and device info
POST /api/analyze  — upload a video, run EfficientNet-B0 visual analysis
"""

from flask import Flask
from flask_cors import CORS

from config import Config
from services.model_service import ModelService
from services.video_service import VideoService, VideoServiceError

import os
import tempfile
import traceback

from flask import jsonify, request

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins=Config.CORS_ORIGINS)

# Initialise services at startup
model_svc = ModelService(Config.MODEL_PATH)
video_svc = VideoService()

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    info = model_svc.status()
    return jsonify({
        "status": "ok",
        "model_loaded": info["loaded"],
        "device": info["device"],
        "model_path": Config.MODEL_PATH,
        "classes": info.get("classes"),
    })


# ---------------------------------------------------------------------------
# Analyze
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm"}
MAX_BYTES = 100 * 1024 * 1024  # 100 MiB
MAX_DURATION = 300.0            # 5 minutes


def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@app.post("/api/analyze")
def analyze():
    # ── 1. File presence ──────────────────────────────────────────────────
    if "video" not in request.files:
        return jsonify({"error": "No video field in request."}), 400

    file = request.files["video"]
    if not file or not file.filename:
        return jsonify({"error": "Empty file upload."}), 400

    # ── 2. Extension check ────────────────────────────────────────────────
    ext = _ext(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported format '.{ext}'. Accepted: MP4, AVI, MOV, MKV, WebM."
        }), 415

    # ── 3. Size check (stream read into temp) ─────────────────────────────
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f".{ext}", dir=Config.UPLOAD_DIR
        ) as tmp:
            tmp_path = tmp.name
            written = 0
            chunk_size = 65536
            while True:
                chunk = file.stream.read(chunk_size)
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_BYTES:
                    return jsonify({
                        "error": "File exceeds the 100 MB limit."
                    }), 413
                tmp.write(chunk)

        # ── 4. Run the pipeline ───────────────────────────────────────────
        result = video_svc.analyze(tmp_path, model_svc, MAX_DURATION)
        return jsonify(result)

    except VideoServiceError as exc:
        return jsonify({"error": str(exc)}), 422

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Unexpected server error. Check backend logs."}), 500

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
