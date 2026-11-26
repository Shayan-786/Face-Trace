"""
Face Trace backend configuration.
All values can be overridden by environment variables.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    # Model checkpoint — place the .pth file here
    MODEL_PATH = os.environ.get(
        "FT_MODEL_PATH",
        os.path.join(BASE_DIR, "models", "efficientnet_b0_finetuned_best.pth"),
    )

    # Temporary upload directory
    UPLOAD_DIR = os.environ.get(
        "FT_UPLOAD_DIR",
        os.path.join(BASE_DIR, "uploads"),
    )

    # CORS — allow the Vite dev server and production build origins
    CORS_ORIGINS = os.environ.get(
        "FT_CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    ).split(",")

    # Flask
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "dev-only-key")
