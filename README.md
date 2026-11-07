# 🌳 Fruit Tree Web

A map of public fruit trees around the world. Zoom out to see circles showing how many trees are in each area, zoom in to see individual trees, and click a tree to see its details, the current weather, the air quality, and a machine learning estimate of whether its soil is dry.

You can also place your own trees on the map (they are kept in the page's memory only and disappear on refresh).

- Tree data: [Falling Fruit](https://fallingfruit.org) database download
- Weather and air quality: [Open-Meteo](https://open-meteo.com)
- Map tiles: OpenStreetMap
- Frontend: React + Vite + Leaflet
- Backend: Python (FastAPI + SQLite + scikit-learn)

For what every file does, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## How the parts fit together

```
Browser (React app, port 5173)
   │
   ├── your Python API (port 8000) ── trees.db (all trees)
   │                               └─ water_model.pkl (ML model)
   │
   └── Open-Meteo (weather + air quality, called directly)
```

You need **two programs running at the same time**: the Python API and the React app. Each one runs in its own terminal.

---

## First-time setup

These steps are written for Windows with VS Code. Mac and Linux differences are noted where they exist.

### Step 1: Install the tools (once)

| Tool | Where | Check it works |
|---|---|---|
| VS Code | code.visualstudio.com | |
| Node.js (LTS version) | nodejs.org | `node --version` |
| Python 3 | python.org/downloads | `python --version` |
| Git | git-scm.com | `git --version` |

When installing Python, **tick "Add python.exe to PATH"** on the first screen. After installing anything, close and reopen VS Code so it picks up the change.

### Step 2: Get the project and open it in VS Code

```bash
git clone https://github.com/Jeges0/FruitTreeWeb.git
cd FruitTreeWeb
code .
```

### Step 3: Open a terminal in VS Code

Press `` Ctrl+` `` (the key above Tab) or use **Terminal > New Terminal**. Make sure the terminal is in the project's main folder (the one containing `package.json`). Check with:

```powershell
pwd
```

### Step 4: Install the React packages

```powershell
npm install
```

This creates the `node_modules` folder. It takes a minute.

### Step 5: Set up Python

Still in the main folder:

```powershell
python -m venv venv
venv\Scripts\activate
pip install pandas numpy fastapi uvicorn scikit-learn requests joblib
```

After `activate` you should see `(venv)` at the start of the terminal line. If PowerShell complains that scripts are disabled, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

| Terminal | Activate command |
|---|---|
| PowerShell (VS Code default) | `venv\Scripts\activate` |
| Git Bash | `source venv/Scripts/activate` |
| Mac / Linux | `source venv/bin/activate` |

You must activate the venv again every time you open a new terminal for Python work.

### Step 6: Download the tree data

1. Go to the Falling Fruit website and find their data download page. https://fallingfruit.org/about/data
2. Download the full database. You get two files: `types.csv` and `locations.csv`.
3. Put both files in the `ml` folder.

`locations.csv` is huge (about 670 MB). It is ignored by git, so it never gets uploaded.

### Step 7: Build the database

```powershell
python ml\build_db.py
```

This reads the big CSV in pieces and writes `ml/trees.db`. It takes a few minutes and prints progress as it goes. When it prints `Done`, continue.

If clicking a tree later feels slow to show its details, add the missing index once:

```powershell
python -c "import sqlite3; con=sqlite3.connect('ml/trees.db'); con.execute('CREATE INDEX IF NOT EXISTS idx_trees_id ON trees (id)'); con.commit(); con.close(); print('done')"
```

### Step 8: Build the circles for the zoomed-out map

```powershell
python ml\build_clusters.py
```

This counts trees per grid cell once, so the zoomed-out map is fast. It takes a minute or two.

### Step 9 (optional): Train the watering model

```powershell
python ml\train_watering.py
```

This downloads historical weather and soil moisture for 40 places where trees exist, trains the model, tests it on places it has never seen, and saves `ml/water_model.pkl`. It prints how it compares to the simple rule-based formula.

- It can take a long time because Open-Meteo limits how fast you can download.
- Every finished place is saved in `ml/cache/`. If it stops (rate limit, network), just run the command again and it continues.
- **You can skip this step.** Without the model the app works normally, only the "chance the soil is dry" bar is missing from the popup.

---

## Starting the app (every time)

Open **two terminals** in VS Code. In the terminal panel, the split icon (or `Ctrl+Shift+5`) puts them side by side.

**Terminal 1: the API**

```powershell
venv\Scripts\activate
cd ml
uvicorn tree_api:app --reload --port 8000
```

Wait for `Application startup complete`.

**Terminal 2: the website**

```powershell
npm run dev
```

Open the address it prints, usually **http://localhost:5173**.

Stop either program with `Ctrl+C` in its terminal.

---

## Check that everything works

1. **The API:** open http://localhost:8000/docs. You should see a page listing the endpoints.
2. **The trees:** open http://localhost:8000/trees?south=47.4&west=19.0&north=47.5&east=19.1. You should see a list of trees (`[]` means none in that box, so try another area).
3. **The map:** zoom out to see green circles with counts, click one to zoom in, and zoom in close to see individual trees.
4. **A tree popup:** click a tree. You should see its details, the weather, the air quality, and (if you trained the model) the chance the soil is dry.
5. **Your own tree:** choose a fruit in the dropdown, press **Add tree**, and click the map.

---

## If something goes wrong

| What you see | Likely cause and fix |
|---|---|
| White screen | A file is empty, unsaved, or an import is wrong. Open the browser console (`F12`) and the `npm run dev` terminal; the first red line names the file. Check for empty files with `Get-ChildItem src -Recurse -File \| Where-Object Length -eq 0`. |
| "Couldn't load tree data. Is the API running?" | Terminal 1 is not running, or not on port 8000. Start it as shown above. |
| Red `CORS` error in the browser console | The website is not on `http://localhost:5173`. Put the exact address shown by `npm run dev` into `allow_origins` in `ml/tree_api.py`. |
| `no such table: trees` | The database is empty. Run `python ml\build_db.py` again. |
| `Circle tables missing` | Run `python ml\build_clusters.py`. |
| Watering bar missing in the popup | The model is not trained yet (`/watering` answers 503). Run step 9, or ignore it. |
| `No module named ...` | The venv is not active, or packages are missing. Activate it and rerun the `pip install` line from step 5. |
| `source` is not recognized | You are in PowerShell. Use `venv\Scripts\activate` instead. |
| `FileNotFoundError: locations.csv` | The CSV is not in the `ml` folder, or your terminal is in a different folder. Check with `pwd` and `dir ml`. |
| Port already in use | An old copy is still running. Close that terminal, or use another port (`--port 8001`) and update `API_URL` in `src/config.js`. |
| Some emojis show as boxes | Older Windows cannot draw newer emojis. Replace them in `src/data/fruits.js`. |
| Browser tab still shows the old icon | Browsers cache icons. Hard refresh with `Ctrl+Shift+R`, or open the site in a new tab. |

---

## Things you can change

| I want to... | Change this |
|---|---|
| Start the map somewhere else | `CENTER` in `src/App.jsx` and `zoom` in `src/components/TreeMap.jsx` |
| Show individual trees later or earlier when zooming | `MIN_ZOOM` in `src/config.js` (higher means circles stay longer) |
| Show fewer trees at once | `MAX_TREES` in `src/config.js` |
| Make circle clicks zoom more or less | `CLUSTER_ZOOM_STEP` in `src/config.js` |
| Add a fruit to the dropdown | `src/data/fruits.js` |
| Use a different soil depth or "dry" threshold for the model | `SOIL_VAR` and `DRY_PERCENTILE` in `ml/train_watering.py`, then retrain |
| Train on more places | `N_LOCATIONS` in `ml/train_watering.py` |

---

## Git notes

These are ignored by git (see `.gitignore`) because they are huge or generated:

```
node_modules/
venv/
__pycache__/
ml/*.csv
ml/*.db
ml/*.pkl
ml/cache/
```

GitHub rejects files over 100 MB, so never commit `locations.csv` or `trees.db`. Anyone cloning the repo repeats steps 6 to 9 to rebuild them.

---

## Data and credits

- Tree data comes from Falling Fruit. Check their site for the license of the data before publishing the app, and keep the "Data: Falling Fruit" credit visible.
- Weather and air quality come from Open-Meteo, which is free for non-commercial use. Air quality data comes from Copernicus CAMS. Check Open-Meteo's terms before any commercial use.
- Map tiles are from OpenStreetMap contributors.