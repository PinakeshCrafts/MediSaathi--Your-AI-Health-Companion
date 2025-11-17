# MediSaathi — Your AI Health Companion
![WhatsApp Image 2025-10-20 at 11 43 02 PM](https://github.com/user-attachments/assets/690b0936-ea36-4055-83b2-b82408e2cd47)

> An end-to-end AI-assisted health assistant that provides medical image (X-ray) fracture detection and a web dashboard for users and clinicians.
> 
> ![WhatsApp Image 2025-10-20 at 11 43 19 PM](https://github.com/user-attachments/assets/cabb71b8-d602-4aac-be5d-7916da93506d)

## Table of Contents

* [About](#about)
* [Features](#features)
* [Tech stack](#tech-stack)
* [Repository structure](#repository-structure)
* [Quick start (Development)](#quick-start-development)

  * [Backend (FastAPI / Python)](#backend-fastapi--python)
  * [Frontend (Vite + React + Tailwind)](#frontend-vite--react--tailwind)
* [API / Endpoints (example)](#api--endpoints-example)
* [Model](#model)
* [Deployment](#deployment)
* [Environment variables](#environment-variables)
* [Testing](#testing)
* [Contributing](#contributing)



## About

MediSaathi is a prototype AI-powered health companion that includes:

* A backend REST API that hosts an ONNX model for fracture detection from X-ray images.
* A modern frontend web app (built with Vite + React + TypeScript + Tailwind) as the user-facing dashboard.
* Deployment configuration for Render (provided `render.yaml` / `render-web.yaml`).

This repo contains both **backend/** and **frontend/** folders so you can run the service locally or deploy to a cloud provider.

## Features

* ONNX-based fracture detection (Densenet169 model: `densenet169_fracture.onnx`).
* REST API to upload medical images and get predictions.
* Responsive dashboard to view results and historic activity.
* Simple deployment manifests for Render.

## Tech stack

**Backend**

* Python 3.8+
* FastAPI (entry: `fastapi.py`)
* ONNX runtime for inference
* Optional: Node (small `server.js` present if used for static serving or helper scripts)

**Frontend**

* Vite + React + TypeScript
* Tailwind CSS
* Package manager: npm / yarn / bun (`bun.lockb` present)

## Repository structure

```
/ (root)
├─ backend/
│  ├─ fastapi.py            # FastAPI entry (API endpoints)
│  ├─ densenet169_fracture.onnx
│  ├─ requirements.txt
│  ├─ render.yaml
│  ├─ start.sh              # helper start script
│  └─ ...
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.ts
│  └─ ...
└─ README.md
```

## Quick start (Development)

> The instructions below assume you have **Python 3.8+**, **node/npm** installed. If you prefer `bun` use the equivalent bun commands.

### Backend (FastAPI / Python)

1. Create a virtual environment and activate it (recommended):

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

3. Run the FastAPI server (example using uvicorn):

```bash
# from repository root
python -m uvicorn Backend.fastapi:app --reload --host 0.0.0.0 --port 8000
```

> If `start.sh` exists and is configured, you may use `bash backend/start.sh` to run with your environment variables.

### Frontend (Vite + React + Tailwind)

1. Install frontend dependencies (npm):

```bash
cd frontend
npm install
# or
# yarn
# bun
```

2. Run dev server:

```bash
npm run dev
# or
npm run build && npm run preview
```

3. Open the dev URL printed by Vite (usually `http://localhost:5173`).

## API / Endpoints (example)

> These are example endpoints. Inspect `backend/fastapi.py` for the exact route names and payload formats.

* `POST /predict` — upload an X-ray image (multipart/form-data) and get fracture detection result.

  * Request: multipart file `image` (png/jpg)
  * Response: `{ "prediction": "fracture" | "no_fracture", "confidence": 0.92 }

* `GET /health` — returns basic health/status of the API.

Adjust clients to point to your backend host and port (or the deployed URL).

## Model

* `backend/densenet169_fracture.onnx` — ONNX model used for inference. The backend uses `onnxruntime` to load the model and run predictions.

**Note:** The model file is included in the repository for convenience. For production, consider storing models in a dedicated object store or model registry and downloading them at build/deploy time.

## Deployment

* The repo contains `render.yaml` and `render-web.yaml` for deploying the backend and frontend to Render. Review and update service names, environment variables and build commands before deploying.
* Alternatively, containerize the backend and frontend using Docker and deploy to your preferred cloud provider.

## Environment variables

Create a `.env` file (not checked into git) for secrets and runtime configuration. Typical variables:

```
# Example .env (backend)
PORT=8000
HOST=0.0.0.0
MODEL_PATH=./densenet169_fracture.onnx
SECRET_KEY=replace_with_secret
# any other DB / auth keys
```

Ensure you add `.env` to `.gitignore` if it contains secrets.

## Testing

* Add unit tests for the model input preprocessing and prediction postprocessing.
* For the frontend use component and integration tests (Jest, Testing Library, or preferred tools).

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a branch with a descriptive name
3. Make changes and add tests
4. Open a pull request describing your changes

Please follow a consistent code style and add documentation for public functions and endpoints.


## Acknowledgements

* Densenet model architecture and ONNX community
* FastAPI and Vite ecosystems



![WhatsApp Image 2025-10-20 at 11 43 02 PM](https://github.com/user-attachments/assets/690b0936-ea36-4055-83b2-b82408e2cd47)
![WhatsApp Image 2025-10-20 at 11 43 02 PM (1)](https://github.com/user-attachments/assets/c062a1ef-87e1-4bc6-bd3c-77d367a95ac8)
![WhatsApp Image 2025-10-20 at 11 48 11 PM](https://github.com/user-attachments/assets/273d7d04-f280-4357-ae0d-148ef01289e8)
![WhatsApp Image 2025-10-20 at 11 43 19 PM](https://github.com/user-attachments/assets/cabb71b8-d602-4aac-be5d-7916da93506d)
