from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib, json, os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)
print("Running land_predict_api.py ...")

# Paths
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "land_price_model.pkl")
FEATS_PATH = os.path.join(HERE, "land_model_features.json")
TS_MODEL_PATH = os.path.join(HERE, "timeseries_model.pkl")

# Load models and feature columns
model = joblib.load(MODEL_PATH)
with open(FEATS_PATH, "r", encoding="utf-8") as f:
    FEATURE_COLS = json.load(f)

try:
    ts_model = joblib.load(TS_MODEL_PATH)
except Exception as e:
    print("Warning: Could not load timeseries model:", e)
    ts_model = None

def fnum(x, default=0.0):
    try:
        if x is None or x == "":
            return default
        n = float(x)
        return n if np.isfinite(n) else default
    except Exception:
        return default

def normalize_zoning(z):
    if not z:
        return ""
    z = str(z).strip().lower()
    mapping = {
        "agricultural": "Agricultural", "agri": "Agricultural",
        "residential": "Residential", "res": "Residential",
        "commercial": "Commercial", "comm": "Commercial",
        "industrial": "Industrial", "ind": "Industrial",
        "conservation": "Conservation",
    }
    return mapping.get(z, z.title())

def derive_area_acres(data):
    acres = fnum(data.get("area"), 0.0)
    sqft = fnum(data.get("Area_sqft"), 0.0)
    cents = fnum(data.get("cents"), 0.0)
    if acres > 0:
        return acres
    if sqft > 0:
        return sqft / 43560.0
    if cents > 0:
        return cents * 0.01   # 100 cents = 1 acre
    return 0.0

def preprocess_input(data):
    area_acres = max(derive_area_acres(data), 0.0)
    norm = {
        "area_acres": area_acres,
        "latitude": fnum(data.get("latitude", 0.0), 0.0),
        "longitude": fnum(data.get("longitude", 0.0), 0.0),
    }
    for f in ["waterApplicable","roadApplicable","schoolApplicable","railwayApplicable","busApplicable"]:
        val = str(data.get(f, "notApplicable")).strip().lower()
        norm[f] = 1 if val in ("applicable","1","true","yes") else 0
    for d in ["waterDistance","roadDistance","schoolDistance","railwayDistance","busDistance"]:
        norm[d] = fnum(data.get(d, 0.0), 0.0)

    norm["zoning"] = normalize_zoning(data.get("zoning", ""))
    # Normalize city/district for consistent matching
    norm["City"] = str(data.get("City", "")).strip().title()
    norm["District"] = str(data.get("District", "")).strip().title()

    df = pd.DataFrame([norm])
    df = pd.get_dummies(df, columns=["zoning", "City", "District"], drop_first=True)
    df = df.reindex(columns=FEATURE_COLS, fill_value=0)

    # Debug
    print("\n==== Incoming JSON ====")
    print(data)
    print("==== Model Input DataFrame row ====")
    print(df)
    print("==============================\n")

    return df, norm

@app.route("/predict/land", methods=["POST"])
def predict_land():
    data = request.get_json(silent=True) or {}
    X, norm = preprocess_input(data)
    raw = float(model.predict(X)[0])

    sqft = fnum(data.get("Area_sqft"), 0.0)
    if sqft <= 0 and norm["area_acres"] > 0:
        sqft = norm["area_acres"] * 43560.0

    zoning = normalize_zoning(data.get("zoning"))
    bands = {
        "Agricultural": (50.0, 1500.0),
        "Residential":  (200.0, 6000.0),
        "Commercial":   (500.0, 12000.0),
        "Industrial":   (150.0, 4000.0),
        "Conservation": (30.0, 800.0),
        "":             (100.0, 6000.0),
    }
    min_pps, max_pps = bands.get(zoning, bands[""])
    min_reasonable = (sqft if sqft > 0 else norm["area_acres"] * 43560.0) * min_pps
    max_reasonable = (sqft if sqft > 0 else norm["area_acres"] * 43560.0) * max_pps

    asking = fnum(data.get("askingPrice") or data.get("actualPrice"), 0.0)
    blended = 0.7 * raw + 0.3 * asking if asking > 0 else raw

    candidate = blended
    if norm["area_acres"] >= 0.5 and candidate < min_reasonable:
        candidate = 0.6 * min_reasonable + 0.4 * candidate

    clamped = min(max(candidate, min_reasonable), max_reasonable)
    final_price = max(clamped, 0.0)

    # EXTRA: simple city-based adjustment so different locations give different prices
    city = norm.get("City", "")
    district = norm.get("District", "")
    location_factor = 1.0

    # Tune these factors as you like
    if city == "Coimbatore" or district == "Coimbatore":
        location_factor = 1.10  # +10%
    elif city == "Madurai" or district == "Madurai":
        location_factor = 0.95  # -5%
    elif city == "Erode" or district == "Erode":
        location_factor = 0.90
    elif city == "Tirunelveli" or district == "Tirunelveli":
        location_factor = 1.05
    elif city == "Thoothukudi" or district == "Thoothukudi":
        location_factor = 0.92
    elif city == "Virudhunagar" or district == "Virudhunagar":
        location_factor = 0.98
    
    # any other city/district stays at 1.0

    final_price *= location_factor

    per_sqft = round(final_price / sqft, 2) if sqft > 0 else None
    per_cent = round(final_price / (norm["area_acres"] / 0.01), 0) if norm["area_acres"] >= 0.01 else None

    # Time series price
    timeseries_price = None
    if ts_model and isinstance(data.get("past_prices"), list):
        past_prices = data.get("past_prices")
        prices5 = list(past_prices)
        if len(prices5) < 5:
            prices5 = [0] * (5 - len(prices5)) + prices5
        elif len(prices5) > 5:
            prices5 = prices5[-5:]
        arr = np.array(prices5).reshape(1, -1)
        try:
            timeseries_price = float(ts_model.predict(arr)[0])
        except Exception:
            timeseries_price = None

    response = {
        "price": round(final_price),
        "price_per_sqft": per_sqft,
        "price_per_cent": per_cent,
    }
    if timeseries_price is not None:
        response["timeseries_price"] = round(timeseries_price)

    return jsonify(response), 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=True)
