from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MotionSyncAI API",
    description="Backend API for the MotionSyncAI movement coaching platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to MotionSyncAI API"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MotionSyncAI"}
