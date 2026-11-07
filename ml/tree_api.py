from pathlib import Path
import sqlite3
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import time

import joblib
import numpy as np
import pandas as pd
import requests

from features import build_features, PAST_DAYS

DB = Path(__file__).parent / "trees.db"


def check_database():
    if not DB.exists() or DB.stat().st_size == 0:
        raise SystemExit("trees.db is missing or empty. Run: python ml\\build_db.py")
    con = sqlite3.connect(DB)
    tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    con.close()
    if "trees" not in tables:
        raise SystemExit("No trees table. Run: python ml\\build_db.py")
    if "clusters_4" not in tables:
        raise SystemExit("Circle tables missing. Run: python ml\\build_clusters.py")


check_database()

MODEL_PATH = Path(__file__).parent / "water_model.pkl"
bundle = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_watering_cache = {}


def risk_level(p: float) -> str:
    if p < 0.2:
        return "Low"
    if p < 0.5:
        return "Medium"
    return "High"

app = FastAPI(title="Fruttree API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your Vite dev server
    allow_methods=["GET"],
    allow_headers=["*"],
)


def query(sql, params=()):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        return [dict(row) for row in con.execute(sql, params)]
    finally:
        con.close()


def level_for_zoom(zoom: int) -> int:
    """Which grid size to use. Bigger zoom = smaller cells."""
    if zoom <= 3:
        return 0
    if zoom <= 5:
        return 1
    if zoom <= 7:
        return 2
    if zoom <= 9:
        return 3
    return 4


@app.get("/")
def root():
    return {"message": "Fruttree API is running. See /docs"}


@app.get("/trees")
def trees_in_area(
    south: float,
    west: float,
    north: float,
    east: float,
    limit: int = Query(300, le=2000),
):
    """Individual trees inside the visible map area."""
    return query(
        """
        SELECT id, lat, lng,
               type_id AS typeId,
               type_name AS typeName,
               scientific_name AS scientificName
        FROM trees
        WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
        LIMIT ?
        """,
        (south, north, west, east, limit),
    )


@app.get("/clusters")
def clusters_in_area(south: float, west: float, north: float, east: float, zoom: int):
    """Tree counts per grid cell, for zoomed-out maps."""
    level = level_for_zoom(zoom)
    return query(
        f"""
        SELECT lat, lng, n AS count
        FROM clusters_{level}
        WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
        LIMIT 3000
        """,
        (south, north, west, east),
    )


@app.get("/trees/{tree_id}")
def tree_details(tree_id: int):
    """Everything we know about one tree (for the popup)."""
    rows = query(
        """
        SELECT id, lat, lng,
               type_name AS typeName,
               scientific_name AS scientificName,
               description,
               season_start AS seasonStart,
               season_stop AS seasonStop,
               no_season AS noSeason,
               access, address, unverified,
               updated_at AS updated
        FROM trees WHERE id = ?
        """,
        (tree_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Tree not found")
    return rows[0]

@app.get("/watering")
def watering(lat: float, lng: float):
    """Chance that the soil around this tree is dry tomorrow."""
    if bundle is None:
        raise HTTPException(status_code=503, detail="Model not trained. Run: python ml\\train_watering.py")

    key = (round(lat, 2), round(lng, 2))
    hit = _watering_cache.get(key)
    if hit and time.time() - hit[0] < 1800:  # reuse for 30 minutes
        return hit[1]

    r = requests.get(FORECAST_URL, params={
        "latitude": lat, "longitude": lng,
        "daily": "precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max",
        "past_days": PAST_DAYS, "forecast_days": 5, "timezone": "auto",
    }, timeout=20)
    if not r.ok:
        raise HTTPException(status_code=502, detail="Weather service failed")

    d = r.json()["daily"]
    daily = pd.DataFrame({
        "date": pd.to_datetime(d["time"]),
        "rain": d["precipitation_sum"],
        "et0": d["et0_fao_evapotranspiration"],
        "tmax": d["temperature_2m_max"],
    }).fillna({"rain": 0, "et0": 0}).ffill()

    row = build_features(daily, lat).iloc[[PAST_DAYS]]  # row 30 = today
    if row.isna().to_numpy().any():
        raise HTTPException(status_code=502, detail="Incomplete weather data")

    raw = bundle["model"].predict_proba(row[bundle["features"]])[:, 1]
    p = float(bundle["calibrator"].predict(raw)[0])

    result = {"probability": round(p, 3), "percent": round(p * 100), "level": risk_level(p)}
    _watering_cache[key] = (time.time(), result)
    return result