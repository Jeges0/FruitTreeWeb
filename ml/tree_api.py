from pathlib import Path
import sqlite3
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

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