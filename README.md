# Face Trace

Face Trace is a multimedia deepfake detection project developed as a BSCS Final Year Project. The analysis pipeline combines EfficientNet-B0 visual deepfake detection with a React frontend for local account management, video upload, and result display.

## Repository structure

```text
Face Trace/
├── frontend/           React 18 / Vite frontend
│   ├── src/            Components, pages, services, styles
│   ├── tests/          Frontend service tests (Node.js test runner)
│   ├── public/         Static assets
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/            Flask visual analysis API
│   ├── app.py          API entry point (GET /api/health, POST /api/analyze)
│   ├── config.py       Configuration (paths, CORS, device)
│   ├── requirements.txt
│   ├── services/
│   │   ├── model_service.py   EfficientNet-B0 loader and inference
│   │   └── video_service.py   Frame sampling, face detection, aggregation
│   ├── models/         Place model checkpoint here (gitignored)
│   ├── uploads/        Temporary upload directory (gitignored)
│   ├── artifacts/      Reserved for future artifacts (gitignored)
│   └── tests/          Backend tests
└── README.md
```

## Model file

Place the trained checkpoint at:

```text
backend/models/efficientnet_b0_finetuned_best.pth
```

This file is excluded from Git. The backend will start without it but the `/api/analyze` endpoint will return an error until the checkpoint is present.

## Running locally (two terminals)

### Prerequisites

- **Node.js 24** and npm (frontend)
- **Python 3.12** and pip (backend)
- PyTorch and other backend dependencies installed (see below)

---

### Terminal 1 — Flask backend

```cmd
cd "d:\Face Trace\backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Install PyTorch separately (CPU-only, Windows):

```cmd
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

Start the server:

```cmd
python app.py
```

The API will be available at: **http://127.0.0.1:5000**

Health check: http://127.0.0.1:5000/api/health

---

### Terminal 2 — React / Vite frontend

```cmd
cd "d:\Face Trace\frontend"
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open: **http://127.0.0.1:5173**

Keep both terminals running while using the app.

---

## Frontend features

- Responsive public pages and workspace navigation.
- Charcoal Teal theme with persistent light and dark modes.
- Sign up, login, logout, and editable user display names.
- Local profile photo: upload JPEG, PNG, or WebP (max 1 MB), stored in browser localStorage.
- Simplified profile menu: Manage Profile and Logout only.
- Video selection via browse or drag and drop.
- File extension, size, MIME-type, and container-header validation.
- **Analyze Now** workflow: sends the video to the Flask backend, shows real-time loading states (sampling frames, detecting faces, running model), then displays EfficientNet-B0 visual prediction, confidence, and per-class probabilities.
- Client-side PDF report download: contains file details, workflow status, and all assessment results.
- History in a card layout with filename search, View Details, Delete, and Delete All Records.
- Record Details: file information, visual assessment result (class, confidence, probabilities), audio status (not available), and assessment sections ready for future backend data.
- Administrator panel with user management, record review, suspension, and deletion.

## Backend API

| Endpoint        | Method | Purpose                                     |
| --------------- | ------ | ------------------------------------------- |
| `/api/health`   | GET    | Model load status, device (CPU / CUDA)      |
| `/api/analyze`  | POST   | Upload a video, receive visual analysis result |

### POST /api/analyze

- Multipart field name: `video`
- Accepted containers: MP4, AVI, MOV, MKV, WebM
- Maximum size: 100 MiB
- Maximum duration: 5 minutes (300 s)

Sample response:

```json
{
  "status": "completed",
  "video": {
    "duration_seconds": 12.4,
    "frames_requested": 10,
    "frames_analyzed": 9,
    "sample_timestamps_seconds": [0.0, 1.4, 2.7]
  },
  "visual": {
    "class_name": "face_replacement",
    "confidence": 72.5,
    "probabilities": {
      "real": 15.0,
      "face_replacement": 72.5,
      "face_manipulation": 12.5
    }
  },
  "audio": {
    "status": "not_available",
    "message": "Audio analysis is not implemented in the current visual-model pipeline."
  }
}
```

## Model details

| Property        | Value                                          |
| --------------- | ---------------------------------------------- |
| Architecture    | EfficientNet-B0 (torchvision)                  |
| Classifier head | Dropout(0.2) → Linear(1280 → 3)               |
| Classes         | real, face_replacement, face_manipulation      |
| Input size      | 224 × 224 RGB                                  |
| Normalization   | ImageNet (mean 0.485/0.456/0.406, std 0.229/0.224/0.225) |
| Face detection  | OpenCV Haar cascade (frontal face)             |
| Frame sampling  | 10–30 frames evenly distributed across timeline |

## Technology

| Area           | Tools                                         |
| -------------- | --------------------------------------------- |
| Frontend       | React 18, Vite 5, React Router 6, Lucide React |
| Backend        | Flask 3, Flask-CORS                           |
| Model          | PyTorch, TorchVision EfficientNet-B0          |
| Video / Vision | OpenCV, Pillow, NumPy                         |
| Persistence    | Browser localStorage (frontend only)         |
| Code quality   | ESLint, Prettier (frontend); Python syntax    |

## Frontend development commands

Run these from the `frontend/` directory:

| Command                | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the Vite development server                  |
| `npm run build`        | Create the production bundle in `frontend/dist/`   |
| `npm run preview`      | Serve the built bundle locally                     |
| `npm run lint`         | Check JavaScript and React code                    |
| `npm test`             | Run frontend service and validation tests          |
| `npm run format`       | Format frontend files with Prettier                |

## Accounts and administrator access

### Regular users

Open **Sign up** to create an account. Accounts are stored only in the current browser. Passwords require 8–128 characters with uppercase, lowercase, a number, and a special character. Signup requires agreement to the Terms & Conditions.

### Fixed administrator account

| Field    | Value                   |
| -------- | ----------------------- |
| Email    | `admin@facetrace.local` |
| Password | `FaceTraceAdmin!2026`   |

**These are intentionally public prototype credentials** included in the client bundle. The frontend does not implement server-side authentication.

## Limitations

- Audio analysis is not implemented. The backend returns `audio.status: "not_available"` for all videos.
- Grad-CAM explanations are not implemented.
- No database — analysis results are stored in browser localStorage only.
- No server-side authentication or user management.
- The model checkpoint must be placed manually; it is not committed to Git.
- Face detection uses OpenCV Haar cascade. Low-resolution or non-frontal faces may not be detected.

## Suggested demonstration

1. Start both servers (see Terminal 1 and Terminal 2 above).
2. Sign up and log in.
3. Upload a profile photo from Manage Profile.
4. Go to Analyze Video, select a short compatible video, click Analyze Now.
5. Watch the real backend states: Sampling frames → Detecting faces → Running model.
6. View the visual prediction, confidence, and class probabilities.
7. Download the PDF report.
8. Open History, view the record details, verify the stored result.
9. Demonstrate file validation with an unsupported file.
10. Log in as administrator and review saved records.
