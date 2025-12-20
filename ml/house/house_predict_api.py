from flask import Flask, request, jsonify
import pandas as pd
import joblib
import json
import numpy as np
import os
from flask_cors import CORS

# MongoDB + GridFS
from pymongo import MongoClient
import gridfs
from bson.objectid import ObjectId

app = Flask(__name__)

# Recommended CORS in dev: React on 3000
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000"]}},
    supports_credentials=True
)

print("Running house_predict_api.py ...")

# ---------------- Prediction setup (House) ----------------
model = joblib.load('house_price_model.pkl')
with open('house_model_features.json') as f:
    feature_cols = json.load(f)

def preprocess_input(data):
    # Log transform area
    area = float(data.get('Area_sqft', 0))
    data['log_Area_sqft'] = np.log1p(area)

    # Map applicable flags
    for flag in ['hospitalApplicable', 'schoolApplicable', 'railwayApplicable', 'busApplicable']:
        if flag in data:
            data[flag] = 1 if str(data[flag]).lower() in ('applicable','yes','true','1') else 0
        else:
            data[flag] = 0

    # Numerics
    for col in ['Bedrooms', 'Bathrooms', 'Year_Built',
                'hospitalDistance', 'schoolDistance', 'railwayDistance', 'busDistance']:
        data[col] = float(data.get(col, 0))

    # One-hot encode
    df = pd.DataFrame([data])
    df = pd.get_dummies(df, columns=['Property_Type', 'Condition'], drop_first=True)

    # Drop original Area_sqft
    df = df.drop(columns=['Area_sqft'], errors='ignore')

    # Reindex to training features
    df = df.reindex(columns=feature_cols, fill_value=0)
    return df

@app.route('/predict/house', methods=['POST'])
def predict():
    data = request.get_json() or {}

    # Safe numeric coercion
    def to_num(v, d=0.0):
        try:
            n = float(v)
            return n if np.isfinite(n) else d
        except Exception:
            return d

    # Reasonable defaults to avoid 0-filled rows
    area = to_num(data.get('Area_sqft'), 900)
    bedrooms = to_num(data.get('Bedrooms'), 2)
    bathrooms = to_num(data.get('Bathrooms'), 1)
    year_built = to_num(data.get('Year_Built'), 2008)
    prop_type = (data.get('Property_Type') or 'Independent House').strip()
    condition = (data.get('Condition') or 'Average').strip()

    # Normalize distances
    for k in ['hospitalDistance','schoolDistance','railwayDistance','busDistance']:
        data[k] = to_num(data.get(k), 0)

    # Normalize flags to strings that preprocess maps to 1/0
    for f in ['hospitalApplicable','schoolApplicable','railwayApplicable','busApplicable']:
        v = (data.get(f) or 'notApplicable').strip().lower()
        data[f] = 'applicable' if v in ('applicable','yes','true','1') else 'notApplicable'

    # Build payload for preprocess
    payload = dict(data)
    payload.update({
        'Area_sqft': area,
        'Bedrooms': bedrooms,
        'Bathrooms': bathrooms,
        'Year_Built': year_built,
        'Property_Type': prop_type,
        'Condition': condition
    })

    X = preprocess_input(payload)
    raw_price = float(model.predict(X)[0])

    # Clamp by price-per-sqft band (tune for your market)
    min_pps = 1500.0      # ₹/sq.ft lower bound
    max_pps = 25000.0     # ₹/sq.ft upper bound
    min_reasonable = area * min_pps
    max_reasonable = area * max_pps

    # Blend toward asking/actual if provided to keep it "near"
    asking = to_num(data.get('askingPrice') or data.get('actualPrice'), 0)
    blended = 0.7 * raw_price + 0.3 * asking if asking > 0 else raw_price

    clamped = min(max(blended, min_reasonable), max_reasonable)
    final_price = max(clamped, 0.0)

    return jsonify({'price': round(final_price, 0)})

# ---------------- Existing CSV submission ----------------
@app.route('/submit/house', methods=['POST'])
def submit_house():
    data = request.get_json()
    csv_path = '../data/house_price_predictions_cleaned.csv'

    # Map lowercase 'location' to 'Location'
    if 'location' in data and 'Location' not in data:
        data['Location'] = data['location']

    expected_cols = [
        "Location", "Area_sqft", "Property_Type", "Bedrooms", "Bathrooms",
        "Year_Built", "Condition",
        "hospitalApplicable", "hospitalDistance",
        "schoolApplicable", "schoolDistance",
        "railwayApplicable", "railwayDistance",
        "busApplicable", "busDistance",
        "latitude", "longitude", "Predicted_Price", "Date"
    ]

    for col in expected_cols:
        if col not in data:
            data[col] = ""

    if not data.get("Date"):
        from datetime import datetime
        data["Date"] = datetime.utcnow().isoformat()

    new_row = pd.DataFrame([{col: data[col] for col in expected_cols}])

    if not os.path.exists(csv_path):
        new_row.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)
        new_row = new_row.reindex(columns=df.columns, fill_value="")
        df = pd.concat([df, new_row], ignore_index=True)
        df.to_csv(csv_path, index=False)

    return jsonify({"status": "success", "message": "Data saved."})

# ---------------- MongoDB + GridFS for sell listings ----------------
DEFAULT_URI = "mongodb://localhost:27017/"
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://karthik69svg:JJQQQgt166fia39J@cluster0.gah2dhz.mongodb.net/smartpropdb?retryWrites=true&w=majority&appName=Cluster0"
)
client = MongoClient(MONGO_URI or DEFAULT_URI)

db_name = os.getenv("MONGO_DB", "smartpropdb")
db = client[db_name]

houses_col = db["houses"]
fs = gridfs.GridFS(db)

def _save_images(files):
    ids = []
    for f in files:
        img_id = fs.put(f, filename=f.filename, content_type=f.content_type)
        ids.append(str(img_id))
    return ids

@app.route('/sell/house', methods=['POST'])
def sell_house():
    form = request.form.to_dict()
    images = request.files.getlist('images')

    if not (1 <= len(images) <= 3):
        return jsonify({"error": "Please upload 1 to 3 images"}), 400

    contact = form.get("contact", "")
    if not contact.isdigit() or len(contact) != 10:
        return jsonify({"error": "Contact number must be exactly 10 digits."}), 400

    image_ids = _save_images(images)
    form["image_ids"] = image_ids

    def as_float(v):
        try:
            return float(v) if v not in ("", None, "") else None
        except Exception:
            return None

    numeric_fields = [
        "Area_sqft", "Bedrooms", "Bathrooms", "Year_Built",
        "hospitalDistance", "schoolDistance", "railwayDistance", "busDistance",
        "latitude", "longitude", "actualPrice"
    ]
    for key in numeric_fields:
        if key in form:
            fv = as_float(form.get(key))
            if fv is not None:
                form[key] = fv

    ins = houses_col.insert_one(form)
    return jsonify({"status": "success", "id": str(ins.inserted_id)}), 200

@app.route('/image/<img_id>', methods=['GET'])
def get_image(img_id):
    try:
        grid_out = fs.get(ObjectId(img_id))
        return app.response_class(grid_out.read(), mimetype=grid_out.content_type)
    except Exception:
        return "Image not found", 404

@app.route('/buy/houses', methods=['GET'])
def list_houses():
    docs = []
    for d in houses_col.find().sort([('_id', -1)]):
        first_img = None
        if isinstance(d.get('image_ids'), list) and d['image_ids']:
            first_img = f"/image/{d['image_ids'][0]}"
        docs.append({
            "id": str(d["_id"]),
            "location": d.get("location", ""),
            "city": d.get("city", ""),
            "area_sqft": d.get("Area_sqft", None),
            "property_type": d.get("Property_Type", ""),
            "bedrooms": d.get("Bedrooms", None),
            "bathrooms": d.get("Bathrooms", None),
            "year_built": d.get("Year_Built", None),
            "condition": d.get("Condition", ""),
            "latitude": d.get("latitude", None),
            "longitude": d.get("longitude", None),
            "actualPrice": d.get("actualPrice", None),
            "contact": d.get("contact", ""),
            "image": first_img
        })
    return jsonify(docs), 200

@app.route('/buy/search', methods=['GET'])
def search_houses():
    state = request.args.get('state', '').strip()
    district = request.args.get('district', '').strip()
    city = request.args.get('city', '').strip()

    q = {}
    if state:
        q['state'] = state
    if district:
        q['district'] = district
    if city:
        q['city'] = city

    docs = []
    for d in houses_col.find(q).sort([('_id', -1)]):
        first_img = None
        if isinstance(d.get('image_ids'), list) and d['image_ids']:
            first_img = f"/image/{d['image_ids'][0]}"
        docs.append({
            "id": str(d["_id"]),
            "location": d.get("location", ""),
            "city": d.get("city", ""),
            "state": d.get("state", ""),
            "district": d.get("district", ""),
            "area_sqft": d.get("Area_sqft", None),
            "property_type": d.get("Property_Type", ""),
            "bedrooms": d.get("Bedrooms", None),
            "bathrooms": d.get("Bathrooms", None),
            "year_built": d.get("Year_Built", None),
            "condition": d.get("Condition", ""),
            "latitude": d.get("latitude", None),
            "longitude": d.get("longitude", None),
            "actualPrice": d.get("actualPrice", None),
            "contact": d.get("contact", ""),
            "image": first_img
        })
    return jsonify(docs), 200

@app.route('/buy/house/<hid>', methods=['GET'])
def get_house(hid):
    d = houses_col.find_one({"_id": ObjectId(hid)})
    if not d:
        return jsonify({"error": "Not found"}), 404
    imgs = []
    if isinstance(d.get('image_ids'), list):
        imgs = [f"/image/{x}" for x in d['image_ids']]
    dresp = {
        "id": str(d["_id"]),
        "location": d.get("location", ""),
        "city": d.get("city", ""),
        "area_sqft": d.get("Area_sqft", None),
        "property_type": d.get("Property_Type", ""),
        "bedrooms": d.get("Bedrooms", None),
        "bathrooms": d.get("Bathrooms", None),
        "year_built": d.get("Year_Built", None),
        "condition": d.get("Condition", ""),
        "latitude": d.get("latitude", None),
        "longitude": d.get("longitude", None),
        "actualPrice": d.get("actualPrice", None),
        "contact": d.get("contact", ""),
        "images": imgs
    }
    return jsonify(dresp), 200

# ---------------- Land routes (Option A) ----------------
lands_col = db["lands"]

@app.route('/sell/land', methods=['POST'])
def sell_land():
    form = request.form.to_dict()
    images = request.files.getlist('images')

    if not (1 <= len(images) <= 3):
        return jsonify({"error": "Please upload 1 to 3 images"}), 400

    contact = form.get("contact", "")
    if not contact.isdigit() or len(contact) != 10:
        return jsonify({"error": "Contact number must be exactly 10 digits."}), 400

    form["image_ids"] = _save_images(images)

    def as_float(v):
        try:
            return float(v) if v not in (None, "", "None") else None
        except Exception:
            return None

    for key in [
        "Area_sqft","latitude","longitude","actualPrice",
        "waterDistance","roadDistance","schoolDistance",
        "railwayDistance","busDistance"
    ]:
        if key in form:
            fv = as_float(form.get(key))
            if fv is not None:
                form[key] = fv

    ins = lands_col.insert_one(form)
    return jsonify({"status": "success", "id": str(ins.inserted_id)}), 200

@app.route('/buy/lands', methods=['GET'])
def list_lands():
    docs = []
    for d in lands_col.find().sort([('_id', -1)]):
        first_img = f"/image/{d['image_ids'][0]}" if isinstance(d.get('image_ids'), list) and d['image_ids'] else None
        docs.append({
            "id": str(d["_id"]),
            "location": d.get("location", ""),
            "state": d.get("state", ""),
            "district": d.get("district", ""),
            "city": d.get("city", ""),
            "area_sqft": d.get("Area_sqft", None),
            "zoning": d.get("zoning", ""),
            "latitude": d.get("latitude", None),
            "longitude": d.get("longitude", None),
            "actualPrice": d.get("actualPrice", None),
            "contact": d.get("contact", ""),
            "image": first_img
        })
    return jsonify(docs), 200

@app.route('/land/<lid>', methods=['GET'])
def get_land(lid):
    d = lands_col.find_one({"_id": ObjectId(lid)})
    if not d:
        return jsonify({"error": "Not found"}), 404
    imgs = [f"/image/{x}" for x in d.get('image_ids', [])] if isinstance(d.get('image_ids'), list) else []
    return jsonify({
        "id": str(d["_id"]),
        "location": d.get("location", ""),
        "state": d.get("state", ""),
        "district": d.get("district", ""),
        "city": d.get("city", ""),
        "area_sqft": d.get("Area_sqft", None),
        "zoning": d.get("zoning", ""),
        "latitude": d.get("latitude", None),
        "longitude": d.get("longitude", None),
        "actualPrice": d.get("actualPrice", None),
        "contact": d.get("contact", ""),
        "images": imgs
    }), 200

# ---------------- Utility ----------------
@app.route('/routes', methods=['GET'])
def list_routes():
    return jsonify({str(r): list(r.methods) for r in app.url_map.iter_rules()})

if __name__ == '__main__':
    app.run(host="localhost", port=5000, debug=True, threaded=True)
