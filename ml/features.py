import numpy as np
import pandas as pd

FEATURES = [
    "rain_7d", "rain_14d", "et0_7d", "tmax_7d", "tmax",
    "days_since_rain", "rain_next3", "month_sin", "month_cos", "abs_lat",
]
PAST_DAYS = 30   # days of history the features need
WET_DAY_MM = 2   # rain below this counts as a dry day


def build_features(daily: pd.DataFrame, lat: float) -> pd.DataFrame:
    """daily: one row per consecutive day with columns date, rain, et0, tmax."""
    d = daily.reset_index(drop=True)
    pos = pd.Series(np.arange(len(d)), index=d.index)
    last_wet = pos.where(d["rain"] >= WET_DAY_MM).ffill()

    f = pd.DataFrame(index=d.index)
    f["rain_7d"] = d["rain"].rolling(7).sum()
    f["rain_14d"] = d["rain"].rolling(14).sum()
    f["et0_7d"] = d["et0"].rolling(7).sum()
    f["tmax_7d"] = d["tmax"].rolling(7).mean()
    f["tmax"] = d["tmax"]
    f["days_since_rain"] = (pos - last_wet).fillna(PAST_DAYS).clip(upper=PAST_DAYS)
    # next 3 days of rain: the forecast when the app runs
    f["rain_next3"] = d["rain"].shift(-1) + d["rain"].shift(-2) + d["rain"].shift(-3)
    month = d["date"].dt.month
    f["month_sin"] = np.sin(2 * np.pi * month / 12)
    f["month_cos"] = np.cos(2 * np.pi * month / 12)
    f["abs_lat"] = abs(lat)
    return f[FEATURES]