from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from telemetry_loader import load_bahrain_2024

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cached_data = None

@app.on_event("startup")
def startup():
    global cached_data
    cached_data = load_bahrain_2024()

@app.get("/telemetry")
def get_data():
    return cached_data
