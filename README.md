# MotionSyncAI

An AI-assisted yoga and exercise posture coach. This repository is the starter scaffold:
- React + Vite frontend
- FastAPI backend
- A modular location for the future MediaPipe pose-detection and posture-analysis engine

## Prerequisites
- Python 3.10+
- Node.js 18+
- npm

## Run the backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

## Run the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Current status
This is the initial project scaffold, not the finished AI system. The API currently exposes a health check. Camera-based pose estimation, exercise classification, joint-angle analysis, and corrective feedback will be implemented in later phases.

## Planned AI modules
- `pose_detection.py`: extract body landmarks from frames
- `pose_classifier.py`: classify supported poses/exercises
- `angle_calculator.py`: calculate joint angles
- `posture_analyzer.py`: compare movement with pose-specific rules
- `feedback_engine.py`: produce actionable correction cues
- `rep_counter.py`: count repetitions for supported exercises

## Safety note
MotionSyncAI is an educational fitness aid, not a medical device. Feedback must not be presented as a diagnosis or guarantee against injury.
