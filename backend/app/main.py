from fastapi import FastAPI, Depends, Request
from app.routers import activity, initiative, strategic_goal, user, activity_stakeholders, dashboard
from app.routers import miscellaneous, locations, activity_cultural, activity_goals, progress_update, stakeholders
from app.routers import activity_leads, milestone
from app.database import engine
from app.auth import get_current_user
# --- FastAPI app + CORS ---
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import app.models

# from dotenv import load_dotenv
# import os
# load_dotenv()

# print("COGNITO_REGION =", os.getenv("COGNITO_REGION"))
# print("COGNITO_USER_POOL_ID =", os.getenv("COGNITO_USER_POOL_ID"))

app = FastAPI(
    title="CREAD & Quillen Tracker API",
    docs_url=None,    # Disable Swagger UI in production
    redoc_url=None,   # Disable ReDoc in production
)

# ── Rate limiting (200 requests/minute per IP across all endpoints) ──
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ✅ CORS MUST be here — before include_router
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://creadquillen.click",
        "https://www.creadquillen.click",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(initiative.router)
app.include_router(strategic_goal.router)
app.include_router(activity.router)
# app.include_router(outcome.router)
app.include_router(miscellaneous.router)
app.include_router(locations.router)
app.include_router(activity_leads.router)
app.include_router(activity_cultural.router)
app.include_router(activity_goals.router)
app.include_router(progress_update.router)
app.include_router(stakeholders.router)
app.include_router(activity_stakeholders.router)
app.include_router(dashboard.router)
app.include_router(milestone.router)

@app.get("/")
def health_check():
    return {"status": "CREAD Quillen Activity Tracker API is running"}

@app.get("/me")
def me(user=Depends(get_current_user)):
    return user