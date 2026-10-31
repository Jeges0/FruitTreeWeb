import pandas as pd

df = pd.read_csv("locations.csv", nrows=3, encoding="utf-8")
print(df.columns.tolist())
print(df.head(3).to_string())