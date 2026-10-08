# Face Trace

Face Trace is a multimedia deepfake detection project developed as a BSCS Final Year Project. Its proposed analysis pipeline combines visual and audio assessment with explainable results.

This repository currently contains the **React frontend prototype**. Users can create local accounts, preview video files, save file-check records, and use separate user and administrator workflows. **AI detection and the backend are not connected yet.**

## Current features

- Responsive public pages and workspace navigation, including a mobile menu.
- Charcoal Teal theme with persistent light and dark modes.
- Sign up, login, logout to the home page, and editable user display names.
- Video selection through browsing or drag and drop.
- File extension, size, MIME-type, and basic container-header validation.
- Local playback and duration checks when the browser supports the video codec.
- Account-specific saved history, filename search, record details, and deletion.
- Administrator panel with registered-user totals, saved-video totals, per-user record counts, search, suspension/reactivation, and record review/deletion.
- Administrator access to video checks and personal history without a second account.
- Form validation, keyboard-accessible controls, confirmation dialogs, and empty states.

## Technology

| Area                  | Tools                     |
| --------------------- | ------------------------- |
| Interface             | React 18, JavaScript, CSS |
| Development and build | Vite 5                    |
| Routing               | React Router 6            |
| Icons                 | Lucide React              |
| Local persistence     | Browser localStorage      |
| Code quality          | ESLint, Prettier          |
| Automated tests       | Node.js test runner       |

## Run locally

Use **Node.js 24** and npm to match the environment used for development and testing.

Open a terminal in the project folder and run:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. If that port is occupied, Vite may choose another port.

For a consistent address:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Then open `http://127.0.0.1:5173`. Keep the terminal running while using the app. No backend server, API key, or environment file is required for the current prototype.

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks npm.

## Accounts and administrator access

### Regular users

Open **Sign up** to create an account. Accounts are stored only in the current browser. There is no built-in regular-user demo account. Use a test password that you do not use elsewhere.

Regular users see their own dashboard, video checks, history, and account page. They do not see the admin link, and the frontend redirects them away from `/admin`.

### Fixed administrator account

Use the normal login page with these temporary credentials:

| Field    | Value                   |
| -------- | ----------------------- |
| Email    | `admin@facetrace.local` |
| Password | `FaceTraceAdmin!2026`   |

The administrator can manage local users and all saved video records, as well as create personal file checks. The fixed admin account is separate from the registered-user count. Its profile is not editable.

**These credentials are intentionally public prototype credentials.** They are included in the client bundle. Frontend route checks and localStorage sessions are not secure authorization; a backend must enforce authentication and permissions before real deployment.

Suspending a user prevents normal sign-in and invalidates their local session checks. Their records remain available, and the administrator can reactivate the account.

## Video support

| Rule                | Current behavior                                               |
| ------------------- | -------------------------------------------------------------- |
| Accepted containers | MP4, AVI, MOV, MKV, WebM                                       |
| Size limit          | 100 MiB, displayed as 100 MB in the interface                  |
| Duration limit      | 5 minutes when duration can be read                            |
| Playback            | Depends on the browser and the file's codec                    |
| Saved data          | File metadata only; the video itself is not stored or uploaded |
| Detection results   | Not available until backend model integration                  |

A supported extension does not guarantee playback or prove that a file is valid. Basic header validation rejects obvious renamed or invalid files; it is not a complete media-integrity check. When playback is unavailable, the interface allows saving file details with playability unverified. Use a browser-compatible MP4 or WebM for a presentation.

**Save file check** creates a metadata record. It does not analyse authenticity or generate a confidence score, audio verdict, or heatmap.

## Data and privacy limitations

- Accounts, the session, theme preference, and saved records use browser localStorage.
- Data is specific to a browser profile and origin. `localhost:5173` and `127.0.0.1:5173` have separate storage, so use the same address consistently.
- Clearing site data removes local accounts and history. Data does not sync between devices or browsers.
- New user passwords are stored as salted PBKDF2-derived hashes, not plaintext. This does not make client-side authentication production-secure.
- Browser password managers may autofill the login form. The app initializes its login fields empty.
- Admin totals represent saved records in this browser, not server uploads or users on other devices.

## Pages

| Route                  | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `/`                    | Public home page                                  |
| `/signup`              | Create a local account                            |
| `/login`               | User or administrator sign-in                     |
| `/dashboard`           | Personal workspace overview                       |
| `/analyze`             | Select, preview, and check a video file           |
| `/history`             | Personal saved records                            |
| `/history/:analysisId` | Personal record details                           |
| `/profile`             | User profile; fixed-account information for admin |
| `/admin`               | Administrator management panel                    |

The old `/register` address redirects to `/signup`. Unrecognized routes show a not-found page.

## Project structure

```text
public/                 Static assets and favicon
src/
  components/           Shared controls, navigation, tables, and route guard
  hooks/                Reactive user and history state
  layouts/              Public and signed-in page layouts
  pages/                Home, auth, dashboard, video, history, profile, and admin pages
  services/             Local authentication, storage, records, and media validation
  styles/               Theme tokens, shared appearance, and workspace styles
  App.jsx               Application routes
  main.jsx              React entry point and theme initialization
tests/                  Service and validation tests
```

## Development commands

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the development server                                         |
| `npm run build`        | Create the production frontend bundle in `dist/`                     |
| `npm run preview`      | Serve the built bundle locally                                       |
| `npm run lint`         | Check JavaScript and React code                                      |
| `npm test`             | Run local authentication, history, admin, and media-validation tests |
| `npm run format`       | Format project files                                                 |
| `npm run format:check` | Check formatting without changing files                              |

Tests use isolated in-memory storage and do not modify browser accounts. A successful build verifies frontend compilation, not completion of the detection pipeline.

For static hosting, configure a fallback to `index.html` for application routes so direct visits to paths such as `/history` work.

## Planned backend and AI work

The proposed direction includes:

- A Flask API with server-side authentication, role checks, and account management.
- Database persistence and actual video upload/storage.
- Media decoding, frame sampling, and audio extraction.
- EfficientNet-based visual analysis.
- Wav2Vec2-based audio assessment.
- Grad-CAM visual explanations and model-generated results.
- Model evaluation and integration testing using suitable datasets.

These are **planned capabilities**, not implemented features in this repository. The architecture may be refined during implementation and evaluation.

## Suggested frontend demonstration

1. Create a user through Sign up and log in.
2. Select a short, compatible video and show its preview.
3. Save the file check and open it from History.
4. Demonstrate validation with an unsupported or empty file.
5. Log out, then log in as the administrator to show users and saved-record totals.
6. Demonstrate the administrator's personal video-check workflow, theme switching, and mobile navigation.

Present this version as a working browser-local frontend prototype. Completion against an academic milestone depends on the assessment rubric; it does not yet demonstrate real deepfake detection.
