from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .http.api_v1 import router as api_router


app = FastAPI(title="Aurio Video Screening MVP", version="0.1.0")


app.add_middleware(
CORSMiddleware,
allow_origins=[settings.CORS_ALLOW_ORIGIN],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
