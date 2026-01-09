from fastapi import FastAPI, Depends
from app.routers import activity, initiative, strategic_goal, user, outcome, miscellaneous, locations, activity_cultural, activity_goals
from app.routers import activity_leads
from app.database import engine
from app.auth import get_current_user
# --- FastAPI app + CORS ---
from fastapi.middleware.cors import CORSMiddleware 
import app.models

# from dotenv import load_dotenv
# import os
# load_dotenv()

# print("COGNITO_REGION =", os.getenv("COGNITO_REGION"))
# print("COGNITO_USER_POOL_ID =", os.getenv("COGNITO_USER_POOL_ID"))

app = FastAPI(title="CREAD & Quillen Tracker API")

# ✅ CORS MUST be here — before include_router
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Add these if needed (though unlikely for the Origin header)
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(initiative.router)
app.include_router(strategic_goal.router)
app.include_router(activity.router)
app.include_router(outcome.router)
app.include_router(miscellaneous.router)
app.include_router(locations.router)
app.include_router(activity_leads.router)
app.include_router(activity_cultural.router)
app.include_router(activity_goals.router)

@app.get("/")
def health_check():
    return {"status": "CREAD Quillen Activity Tracker API is running"}

@app.get("/me")
def me(user=Depends(get_current_user)):
    return user