from pathlib import Path
import sqlite3
import time

DB = Path(__file__).parent / "trees.db"

# Grid cell sizes in degrees, from world view to city view.
# Must match CELL_SIZES in tree_api.py
CELL_SIZES = [8, 2, 0.5, 0.125, 0.03125]

con = sqlite3.connect(DB)

for level, size in enumerate(CELL_SIZES):
    start = time.time()
    table = f"clusters_{level}"
    con.execute(f"DROP TABLE IF EXISTS {table}")
    con.execute(f"""
        CREATE TABLE {table} AS
        SELECT AVG(lat) AS lat, AVG(lng) AS lng, COUNT(*) AS n
        FROM trees
        GROUP BY CAST((lat + 90) / {size} AS INTEGER),
                 CAST((lng + 180) / {size} AS INTEGER)
    """)
    con.execute(f"CREATE INDEX idx_{table} ON {table} (lat, lng)")
    con.commit()
    rows = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    print(f"Level {level} ({size} degree cells): {rows:,} circles in {time.time() - start:.0f}s")

con.close()
print("Done")