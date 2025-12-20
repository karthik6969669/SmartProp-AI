# ml/land/train_land_model.py
import os, json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "../data/land_data_with_timeseries.csv")  # use new CSV
MODEL_OUT = os.path.join(HERE, "land_price_model.pkl")
FEATS_OUT = os.path.join(HERE, "land_model_features.json")
TS_MODEL_OUT = os.path.join(HERE, "timeseries_model.pkl")

df = pd.read_csv(DATA)

# Normalize categorical string features to ensure consistency
for c in ["City", "District", "zoning"]:
    if c not in df.columns:
        df[c] = ""
    else:
        df[c] = df[c].astype(str).str.strip().str.title().replace({np.nan:""})

# Area
if "area" in df.columns:
    df["area_acres"] = pd.to_numeric(df["area"], errors="coerce")
elif "Area_sqft" in df.columns:
    df["area_acres"] = pd.to_numeric(df["Area_sqft"], errors="coerce") / 43560.0
else:
    df["area_acres"] = np.nan

for c in ["latitude", "longitude"]:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    else:
        df[c] = np.nan

flag_cols = ["waterApplicable","roadApplicable","schoolApplicable","railwayApplicable","busApplicable"]
for c in flag_cols:
    if c in df.columns:
        df[c] = (
            df[c].astype(str).str.strip().str.lower()
              .map({"applicable":1,"notapplicable":0,"1":1,"0":0,"true":1,"false":0})
        )

dist_cols = ["waterDistance","roadDistance","schoolDistance","railwayDistance","busDistance"]
for c in dist_cols:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")

target_col = None
for cand in ["price","total_price","Price","Total_Price","Predicted_Price"]:
    if cand in df.columns:
        target_col = cand
        break

if target_col is None:
    if "price_per_cent" in df.columns:
        df["price"] = pd.to_numeric(df["price_per_cent"], errors="coerce") * (df["area_acres"] / 0.01)
        target_col = "price"
    elif "price_per_acre" in df.columns:
        df["price"] = pd.to_numeric(df["price_per_acre"], errors="coerce") * df["area_acres"]
        target_col = "price"
    else:
        raise ValueError("No total price or per-unit price columns found.")

y = pd.to_numeric(df[target_col], errors="coerce")

crit_mask = (
    y.notna() & (y > 0) &
    df["area_acres"].notna() & (df["area_acres"] > 0) &
    df["latitude"].notna() & df["longitude"].notna()
)
df, y = df[crit_mask].copy(), y[crit_mask]

for c in flag_cols:
    if c not in df.columns:
        df[c] = 0
    df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0).astype(int)
for c in dist_cols:
    if c not in df.columns:
        df[c] = 0.0
    df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)

lo, hi = y.quantile(0.01), y.quantile(0.99)
y = y.clip(lower=lo, upper=hi)

df = pd.get_dummies(df, columns=["zoning","City","District"], drop_first=True)
# PRINT to check location columns - this is important!
print("Sample columns with 'City_':", [c for c in df.columns if c.startswith("City_")])
print("Sample columns with 'District_':", [c for c in df.columns if c.startswith("District_")])
print("Sample feature row:", df.head(1))

base_feats = ["area_acres","latitude","longitude"] + flag_cols + dist_cols
cat_feats = [c for c in df.columns if c.startswith(("zoning_","City_","District_"))]
features = [c for c in base_feats if c in df.columns] + cat_feats

X = df[features].replace([np.inf,-np.inf], np.nan).fillna(0.0)

# Save feature schema for API
with open(FEATS_OUT, "w", encoding="utf-8") as f:
    json.dump(list(X.columns), f)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=600,
    max_depth=None,
    min_samples_split=4,
    min_samples_leaf=2,
    n_jobs=-1,
    random_state=42
)
model.fit(X_train, y_train)

print("Feature-model Train R2:", round(model.score(X_train, y_train), 4))
print("Feature-model Test R2:", round(model.score(X_test, y_test), 4))
joblib.dump(model, MODEL_OUT)
print("Saved:", MODEL_OUT)
print("Saved:", FEATS_OUT)

scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print("Feature-model 5-fold CV R2:", np.round(scores, 4), "Mean:", round(scores.mean(), 4))

# ---- Timeseries Model ----
if 'past_prices' in df.columns:
    def parse_prices(p):
        if isinstance(p, str):
            return [float(x) for x in p.strip('[]').replace(' ', '').split(',') if x]
        elif isinstance(p, list):
            return p
        else:
            return [0]*5
    X_ts = df['past_prices'].apply(parse_prices).tolist()
    X_ts = np.array(X_ts)
    y_ts = y.values

    X_train_ts, X_test_ts, y_train_ts, y_test_ts = train_test_split(
        X_ts, y_ts, test_size=0.2, random_state=42
    )
    ts_model = RandomForestRegressor(
        n_estimators=400,
        random_state=42
    )
    ts_model.fit(X_train_ts, y_train_ts)

    print("Timeseries-model Train R2:", round(ts_model.score(X_train_ts, y_train_ts), 4))
    print("Timeseries-model Test R2:", round(ts_model.score(X_test_ts, y_test_ts), 4))

    joblib.dump(ts_model, TS_MODEL_OUT)
    print("Saved:", TS_MODEL_OUT)

    scores_ts = cross_val_score(ts_model, X_ts, y_ts, cv=5, scoring="r2")
    print("Timeseries-model 5-fold CV R2:", np.round(scores_ts, 4), "Mean:", round(scores_ts.mean(), 4))
else:
    print("No 'past_prices' found. Timeseries model not saved.")
