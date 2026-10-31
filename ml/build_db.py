from pathlib import Path
import sqlite3
import pandas as pd

HERE = Path(__file__).parent
DB = HERE / "trees.db"

COLUMNS = [
    "id", "type_ids", "lat", "lng", "unverified", "description",
    "season_start", "season_stop", "no_season", "access",
    "address", "updated_at", "hidden",
]

# --- Fruit type names ---
types = pd.read_csv(
    HERE / "types.csv",
    usecols=["id", "scientific_name", "en_name"],
    encoding="utf-8",
)
types["name"] = types["en_name"].fillna(types["scientific_name"])
type_names = dict(zip(types["id"], types["name"]))
type_latin = dict(zip(types["id"], types["scientific_name"]))

if DB.exists():
    DB.unlink()  # start fresh
con = sqlite3.connect(DB)

total = 0
for chunk in pd.read_csv(
    HERE / "locations.csv", usecols=COLUMNS, chunksize=300_000, encoding="utf-8"
):
    chunk = chunk[~chunk["hidden"].astype(str).str.lower().eq("true")].copy()

    chunk["lat"] = pd.to_numeric(chunk["lat"], errors="coerce").round(6)
    chunk["lng"] = pd.to_numeric(chunk["lng"], errors="coerce").round(6)
    chunk = chunk.dropna(subset=["lat", "lng"])

    # type_ids can hold several ids; keep the first
    chunk["type_id"] = pd.to_numeric(
        chunk["type_ids"].astype(str).str.extract(r"(\d+)")[0], errors="coerce"
    )
    chunk["type_name"] = chunk["type_id"].map(type_names).fillna("Fruit tree")
    chunk["scientific_name"] = chunk["type_id"].map(type_latin)
    chunk["unverified"] = chunk["unverified"].astype(str).str.lower().eq("true")
    chunk["no_season"] = chunk["no_season"].astype(str).str.lower().eq("true")

    out = chunk[[
        "id", "lat", "lng", "type_id", "type_name", "scientific_name",
        "description", "season_start", "season_stop", "no_season",
        "access", "address", "unverified", "updated_at",
    ]]
    out.to_sql("trees", con, if_exists="append", index=False)

    total += len(out)
    print(f"Saved {total:,} trees")

print("Building index (this makes map lookups fast)...")
con.execute("CREATE INDEX idx_trees_lat_lng ON trees (lat, lng)")
con.execute("CREATE INDEX idx_trees_type ON trees (type_id)")
con.execute("CREATE INDEX idx_trees_id ON trees (id)")
con.commit()
con.close()

print(f"Done: {DB} ({DB.stat().st_size / 1_000_000:.0f} MB)")