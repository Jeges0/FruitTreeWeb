from pathlib import Path
import sqlite3
import time

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import brier_score_loss, roc_auc_score

from features import FEATURES, PAST_DAYS, build_features

HERE = Path(__file__).parent
CACHE = HERE / "cache"
CACHE.mkdir(exist_ok=True)

N_LOCATIONS = 40
YEARS = range(2020, 2026)  # 2020 to 2025
SOIL_VAR = "soil_moisture_7_to_28cm"   # root zone. Alternative: soil_moisture_28_to_100cm
DRY_PERCENTILE = 0.20                  # "dry" = driest 20% of days at that place
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def pick_locations():
    """Random real tree locations from the database, one per 1-degree cell."""
    path = CACHE / "locations.csv"
    if path.exists():
        return pd.read_csv(path)
    con = sqlite3.connect(HERE / "trees.db")
    rows = pd.read_sql(
        "SELECT lat, lng FROM trees WHERE id % 500 = 0 ORDER BY RANDOM() LIMIT 3000", con
    )
    con.close()
    rows["cell"] = rows["lat"].round(0).astype(str) + "_" + rows["lng"].round(0).astype(str)
    rows = rows.drop_duplicates("cell").head(N_LOCATIONS)[["lat", "lng"]].round(2)
    rows.to_csv(path, index=False)
    return rows


def request_json(params):
    """One API call that survives empty replies and rate limits."""
    for attempt in range(6):
        wait = 20 * (attempt + 1)
        try:
            r = requests.get(ARCHIVE_URL, params=params, timeout=120)
        except requests.RequestException as e:
            print(f"  network problem ({type(e).__name__}), retrying in {wait}s")
            time.sleep(wait)
            continue

        try:
            data = r.json()
        except ValueError:
            print(f"  reply was not JSON (status {r.status_code}): {r.text[:150]!r}")
            print(f"  retrying in {wait}s")
            time.sleep(wait)
            continue

        if isinstance(data, dict) and data.get("error"):
            reason = str(data.get("reason", ""))
            if "limit" in reason.lower():
                if "daily" in reason.lower():
                    raise SystemExit(
                        "Daily request limit reached. Run the script again tomorrow: "
                        "finished places are saved."
                    )
                print(f"  rate limited ({reason}), waiting {wait}s")
                time.sleep(wait)
                continue
            raise SystemExit(f"API error: {reason}")

        return data

    raise SystemExit("The API kept failing. Run again in a few minutes: finished places are saved.")


def load_location(lat, lng):
    """Daily weather plus soil moisture for one place, fetched one year at a time."""
    path = CACHE / f"{lat}_{lng}.csv"
    if path.exists():
        return pd.read_csv(path, parse_dates=["date"])

    parts = []
    for year in YEARS:
        data = request_json({
            "latitude": lat, "longitude": lng,
            "start_date": f"{year}-01-01", "end_date": f"{year}-12-31",
            "daily": "precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max",
            "hourly": SOIL_VAR,
            "timezone": "auto",
        })
        daily = pd.DataFrame({
            "date": pd.to_datetime(data["daily"]["time"]),
            "rain": data["daily"]["precipitation_sum"],
            "et0": data["daily"]["et0_fao_evapotranspiration"],
            "tmax": data["daily"]["temperature_2m_max"],
        })
        hourly = pd.DataFrame({
            "time": pd.to_datetime(data["hourly"]["time"]),
            "soil": data["hourly"][SOIL_VAR],
        })
        soil_by_day = hourly.groupby(hourly["time"].dt.normalize())["soil"].mean()
        daily["soil"] = daily["date"].map(soil_by_day)
        parts.append(daily)
        time.sleep(1)

    result = pd.concat(parts, ignore_index=True)
    result.to_csv(path, index=False)
    return result


def bucket_depletion(daily):
    """The rule-based formula from the app, kept as a baseline to beat."""
    dep, out = 0.0, []
    for rain, et0 in zip(daily["rain"], daily["et0"]):
        used = et0 * 0.8
        gained = rain if rain >= 2 else 0
        dep = min(30.0, max(0.0, dep + used - gained))
        out.append(dep)
    return np.array(out)


# ---------- Build the dataset ----------
locations = pick_locations()
print(f"{len(locations)} places to use")

frames = []
for group, (lat, lng) in enumerate(locations.itertuples(index=False)):
    print(f"[{group + 1}/{len(locations)}] {lat}, {lng}")
    daily = load_location(lat, lng)
    if daily["soil"].isna().mean() > 0.2:
        print("  no soil data here (sea or edge cell), skipping")
        continue
    daily = daily.fillna({"rain": 0, "et0": 0}).ffill()

    threshold = daily["soil"].quantile(DRY_PERCENTILE)
    tomorrow = daily["soil"].shift(-1)

    df = build_features(daily, lat)
    df["baseline"] = bucket_depletion(daily)
    df["dry_tomorrow"] = np.where(tomorrow.notna(), (tomorrow < threshold).astype(float), np.nan)
    df["group"] = group
    frames.append(df.iloc[PAST_DAYS:])

data = pd.concat(frames).dropna()
print(f"\n{len(data):,} training days from {data['group'].nunique()} places")
print(f"Base rate of 'dry': {data['dry_tomorrow'].mean():.0%}")

# ---------- Split by PLACE so the test uses places the model never saw ----------
rng = np.random.default_rng(42)
groups = rng.permutation(data["group"].unique())
if len(groups) < 6:
    raise SystemExit("Too few places with data. Raise N_LOCATIONS and rerun.")
n_test = max(1, int(len(groups) * 0.2))
n_cal = max(1, int(len(groups) * 0.2))
test_g, cal_g, train_g = groups[:n_test], groups[n_test:n_test + n_cal], groups[n_test + n_cal:]

train = data[data["group"].isin(train_g)]
cal = data[data["group"].isin(cal_g)]
test = data[data["group"].isin(test_g)]

# ---------- Train ----------
model = HistGradientBoostingClassifier(
    max_iter=300, learning_rate=0.05, max_depth=6, random_state=42
)
model.fit(train[FEATURES], train["dry_tomorrow"])

# Calibrate, so "70%" really means about 70 out of 100 similar days
calibrator = IsotonicRegression(out_of_bounds="clip")
calibrator.fit(model.predict_proba(cal[FEATURES])[:, 1], cal["dry_tomorrow"])

# ---------- Evaluate on unseen places ----------
raw = model.predict_proba(test[FEATURES])[:, 1]
final = calibrator.predict(raw)
y = test["dry_tomorrow"]

print("\n--- Results on places the model has never seen ---")
print(f"Model AUC:             {roc_auc_score(y, final):.3f}   (0.5 = guessing, 1.0 = perfect)")
print(f"Water-balance formula: {roc_auc_score(y, test['baseline']):.3f}")
print(f"Brier score (lower is better): raw {brier_score_loss(y, raw):.3f}, calibrated {brier_score_loss(y, final):.3f}")

print("\nCalibration: predicted chance vs what really happened")
bins = pd.cut(final, [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0], include_lowest=True)
table = pd.DataFrame({"predicted": final, "actual": y.values}).groupby(bins, observed=True).agg(
    predicted=("predicted", "mean"), actual=("actual", "mean"), days=("actual", "size")
)
print(table.round(2))

joblib.dump({"model": model, "calibrator": calibrator, "features": FEATURES}, HERE / "water_model.pkl")
print("\nSaved ml/water_model.pkl")