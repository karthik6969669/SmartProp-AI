# ml/data/generate_tn_land_house.py
import csv, random, math, os, json
from datetime import datetime
random.seed(42)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
LAND_OUT = os.path.join(OUT_DIR, "land_price_predictions.csv")
HOUSE_OUT = os.path.join(OUT_DIR, "house_price_predictions_cleaned.csv")

YEARS = list(range(datetime.utcnow().year - 4, datetime.utcnow().year + 1))  # last 5 years inclusive

# Tamil Nadu localities (street-ish names for sample realism)
TN_SEEDS = [
    # street, city, district, state, lat, lng
    ("Dindigul Rd, Palani", "Palani", "Dindigul", "Tamil Nadu", 10.4508, 77.5148),
    ("East Coast Rd, Thiruvanmiyur", "Chennai", "Chennai", "Tamil Nadu", 12.9834, 80.2590),
    ("100 Feet Rd, Velachery", "Chennai", "Chennai", "Tamil Nadu", 12.9791, 80.2209),
    ("Avinashi Rd, Peelamedu", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.0183, 76.9970),
    ("Trichy Rd, Singanallur", "Coimbatore", "Coimbatore", "Tamil Nadu", 10.9979, 76.9994),
    ("Alagarkoil Rd", "Madurai", "Madurai", "Tamil Nadu", 9.9677, 78.1653),
    ("Bypass Rd", "Madurai", "Madurai", "Tamil Nadu", 9.9240, 78.1350),
    ("Sathyamangalam Rd, Edayarpalayam", "Erode", "Erode", "Tamil Nadu", 11.3490, 77.6951),
    ("NH 44, Tirunelveli", "Tirunelveli", "Tirunelveli", "Tamil Nadu", 8.7139, 77.7567),
    ("Rajapalayam Rd", "Virudhunagar", "Virudhunagar", "Tamil Nadu", 9.4523, 77.5533),
    ("Gandhipuram Cross Cut", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.0175, 76.9725),
    ("MTP Rd", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.0616, 76.9366),
    ("Ettayapuram Rd", "Thoothukudi", "Thoothukudi", "Tamil Nadu", 8.8130, 78.1341),
    ("Simmakkal", "Madurai", "Madurai", "Tamil Nadu", 9.9210, 78.1197),
]

ZONINGS = ["Agricultural", "Residential", "Commercial", "Industrial", "Conservation"]
PROP_TYPES = ["Apartment", "Villa", "Independent House", "Duplex"]
CONDITIONS = ["Excellent", "Good", "Needs Renovation"]

def city_factor(city):
    return {
        "Chennai": 1.6,
        "Coimbatore": 1.25,
        "Madurai": 1.10,
        "Erode": 0.95,
        "Tirunelveli": 0.90,
        "Virudhunagar": 0.85,
        "Thoothukudi": 0.90,
        "Palani": 1.30,  # base uplift; Palani hotspot handled separately below
    }.get(city, 1.0)

def land_zone_base(zone):
    return {
        "Agricultural": 20e5,    # per acre base INR
        "Residential": 65e5,
        "Commercial": 110e5,
        "Industrial": 80e5,
        "Conservation": 12e5,
    }[zone]

def house_psf_base(city):
    # base INR per sqft
    return {
        "Chennai": 7000,
        "Coimbatore": 4500,
        "Madurai": 3800,
        "Erode": 3000,
        "Tirunelveli": 2800,
        "Virudhunagar": 2600,
        "Thoothukudi": 2700,
        "Palani": 4200,  # anchor with trend
    }.get(city, 3000)

def amenity_bump(flags):
    # up to +12% for strong amenity presence
    bump = 0.0
    if flags["waterApplicable"]: bump += 0.02
    if flags["roadApplicable"]: bump += 0.04
    if flags["schoolApplicable"]: bump += 0.02
    if flags["railwayApplicable"]: bump += 0.02
    if flags["busApplicable"]: bump += 0.02
    return min(bump, 0.12)

def distance_penalty(d):
    # simple penalty for distances (km)
    return 1.0 - min(d / 20.0, 0.15)

def year_trend(year):
    base = YEARS[0]
    steps = year - base
    return 1.0 + steps * random.uniform(0.02, 0.04)

def draw_flags():
    return {
        "waterApplicable": random.random() < 0.7,
        "roadApplicable": random.random() < 0.8,
        "schoolApplicable": random.random() < 0.6,
        "railwayApplicable": random.random() < 0.5,
        "busApplicable": random.random() < 0.7,
    }

def draw_dists(flags):
    def dist(app):
        if not app: return 0.0
        return round(random.uniform(0.2, 6.0), 2)
    return {
        "waterDistance": dist(flags["waterApplicable"]),
        "roadDistance": dist(flags["roadApplicable"]),
        "schoolDistance": dist(flags["schoolApplicable"]),
        "railwayDistance": dist(flags["railwayApplicable"]),
        "busDistance": dist(flags["busApplicable"]),
    }

def palani_cent_anchor(street, city, zone, area_acres):
    # If Palani + Residential pockets, anchor near ₹4,00,000 per cent where applicable.
    if city != "Palani": return None
    if zone not in ("Residential", "Commercial"): return None
    cents = area_acres / 0.01  # 1 cent = 0.01 acre
    per_cent = 4_00_000  # INR
    total = cents * per_cent
    # add mild noise +/- 10%
    total *= random.uniform(0.9, 1.1)
    return total

# ---------- LAND ----------
def gen_land(n=2000):
    header = ["Street","City","District","State","SALE_YEAR",
              "area","zoning","latitude","longitude",
              "waterApplicable","waterDistance",
              "roadApplicable","roadDistance",
              "schoolApplicable","schoolDistance",
              "railwayApplicable","railwayDistance",
              "busApplicable","busDistance",
              "price"]
    rows = [header]
    for _ in range(n):
        street, city, district, state, lat, lng = random.choice(TN_SEEDS)
        zone = random.choice(ZONINGS)
        year = random.choice(YEARS)

        # draw area (acres): small plots to estates
        area = round(random.choice([
            random.uniform(0.01, 0.15),   # micro plots
            random.uniform(0.15, 0.5),    # small plots
            random.uniform(0.5, 2.0),     # medium
            random.uniform(2.0, 8.0),     # large
        ]), 4)

        flags = draw_flags()
        dists = draw_dists(flags)

        # base price model (per acre)
        per_acre = land_zone_base(zone) * city_factor(city)
        # amenity and distance effect
        mult = 1.0 + amenity_bump(flags)
        for k in ["waterDistance","roadDistance","schoolDistance","railwayDistance","busDistance"]:
            mult *= distance_penalty(dists[k])
        mult *= year_trend(year)

        # Palani hotspot anchor for residential/commercial cents
        anchored = palani_cent_anchor(street, city, zone, area)

        if anchored is None:
            total_price = per_acre * area * mult
        else:
            # Blend anchor with model for stability
            model_price = per_acre * area * mult
            total_price = 0.7 * anchored + 0.3 * model_price

        total_price = round(total_price, -2)

        rows.append([
            street, city, district, state, year,
            area, zone, lat, lng,
            "applicable" if flags["waterApplicable"] else "notApplicable", dists["waterDistance"],
            "applicable" if flags["roadApplicable"] else "notApplicable", dists["roadDistance"],
            "applicable" if flags["schoolApplicable"] else "notApplicable", dists["schoolDistance"],
            "applicable" if flags["railwayApplicable"] else "notApplicable", dists["railwayDistance"],
            "applicable" if flags["busApplicable"] else "notApplicable", dists["busDistance"],
            int(total_price)
        ])
    with open(LAND_OUT, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print("Wrote", LAND_OUT)

# ---------- HOUSE ----------
def house_condition_factor(cond):
    return {"Excellent": 1.12, "Good": 1.0, "Needs Renovation": 0.86}[cond]

def gen_house(n=2000):
    header = ["Location","Street","City","District","State",
              "Area_sqft","Property_Type","Bedrooms","Bathrooms",
              "Year_Built","Condition","latitude","longitude",
              "hospitalApplicable","hospitalDistance",
              "schoolApplicable","schoolDistance",
              "railwayApplicable","railwayDistance",
              "busApplicable","busDistance",
              "Predicted_Price"]
    rows = [header]
    now_year = datetime.utcnow().year
    for _ in range(n):
        street, city, district, state, lat, lng = random.choice(TN_SEEDS)
        area_sqft = int(random.choice([
            random.uniform(350, 700),
            random.uniform(700, 1200),
            random.uniform(1200, 2200),
            random.uniform(2200, 4200),
        ]))
        ptype = random.choice(PROP_TYPES)
        beds = random.choice([1,2,3,4,5])
        baths = min(6, max(1, beds + random.choice([-1,0,0,1])))

        ybuilt = random.randint(now_year - 35, now_year)
        cond = random.choice(CONDITIONS)

        flags = {
            "hospitalApplicable": random.random() < 0.7,
            "schoolApplicable": random.random() < 0.8,
            "railwayApplicable": random.random() < 0.5,
            "busApplicable": random.random() < 0.8,
        }
        dists = {
            "hospitalDistance": round(random.uniform(0.2, 6.0), 2) if flags["hospitalApplicable"] else 0.0,
            "schoolDistance": round(random.uniform(0.2, 6.0), 2) if flags["schoolApplicable"] else 0.0,
            "railwayDistance": round(random.uniform(0.5, 10.0), 2) if flags["railwayApplicable"] else 0.0,
            "busDistance": round(random.uniform(0.1, 5.0), 2) if flags["busApplicable"] else 0.0,
        }

        base_psf = house_psf_base(city)
        # Add property type and condition effects
        ptype_mult = {
            "Apartment": 1.0, "Villa": 1.35, "Independent House": 1.18, "Duplex": 1.22
        }[ptype]
        cond_mult = house_condition_factor(cond)
        age_mult = max(0.7, 1.0 - (now_year - ybuilt) * 0.005)

        amen_mult = 1.0
        if flags["hospitalApplicable"]: amen_mult += 0.02
        if flags["schoolApplicable"]: amen_mult += 0.03
        if flags["railwayApplicable"]: amen_mult += 0.02
        if flags["busApplicable"]: amen_mult += 0.02

        # Distance penalties
        for k in dists:
            amen_mult *= (1.0 - min(dists[k] / 25.0, 0.12))

        # Year trend baked into base_psf a bit through random noise
        psf = base_psf * ptype_mult * cond_mult * age_mult * amen_mult * random.uniform(0.92, 1.08)
        total = psf * area_sqft
        total = round(total, -2)

        rows.append([
            f"{street}, {city}",
            street, city, district, state,
            area_sqft, ptype, beds, baths, ybuilt, cond, lat, lng,
            "applicable" if flags["hospitalApplicable"] else "notApplicable", dists["hospitalDistance"],
            "applicable" if flags["schoolApplicable"] else "notApplicable", dists["schoolDistance"],
            "applicable" if flags["railwayApplicable"] else "notApplicable", dists["railwayDistance"],
            "applicable" if flags["busApplicable"] else "notApplicable", dists["busDistance"],
            int(total)
        ])
    with open(HOUSE_OUT, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print("Wrote", HOUSE_OUT)

if __name__ == "__main__":
    gen_land(2000)
    gen_house(2000)
