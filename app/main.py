from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Exercise Timer")

STATIC_DIR = Path(__file__).parent / "static"


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"success": True, "data": {"status": "ok"}, "error": None})


# Mount static files last so /health takes priority
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
