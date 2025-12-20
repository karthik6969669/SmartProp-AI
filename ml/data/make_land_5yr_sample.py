import csv, random, math, os
from datetime import datetime

OUT = os.path.join(os.path.dirname(__file__), "land_price_predictions.csv")

random.seed(42)

# Fixed schema (consistent across all rows)
HEADER = [
    "Location","City","District","State","SALE_YEAR",
    "area","zoning","latitude","longitude",
    "waterApplicable","waterDistance",
    "roadApplicable","roadDistance",
    "schoolApplicable","schoolDistance",
    "railwayApplicable","railwayDistance",
    "busApplicable","busDistance",
    "price"
]

# Seed parcels (you can add/replace with your own)
PARCELS = [
    # (Location, City, District, State, lat, lng, base_zone, base_area_acres)
    ("HMFG+X7M, Krishnan Kovil, Tamil Nadu 626126, India", "Madurai", "Madurai", "Tamil Nadu", 9.9366, 78.1217, "Industrial", 0.25),
    ("2XWX+QHJ, VOC Nagar, Coimbatore, Tamil Nadu 641006, India", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.0470, 76.9989, "Agricultural", 0.5),
    ("MMR9+244, Melathiruvengadanathapuram, Tamil Nadu 627006, India", "Tirunelveli", "Tirunelveli", "Tamil Nadu", 8.6898, 77.6680, "Residential", 0.3),
    ("Thirumazhisai Township, Chennai, India", "Chennai", "Chennai", "Tamil Nadu", 13.0722, 80.0454, "Residential", 0.35),
    ("Perungudi Industrial Area, Chennai, India", "Chennai", "Chennai", "Tamil Nadu", 12.9712, 80.2485, "Industrial", 0.4),
    ("Sulur Ring Road, Coimbatore, India", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.0266, 77.1323, "Commercial", 0.6),
    ("Pollachi Main Rd, Coimbatore, India", "Coimbatore", "Coimbatore", "Tamil Nadu", 10.6580, 76.9970, "Agricultural", 0.9),
    ("Ambattur Estate, Chennai, India", "Chennai", "Chennai", "Tamil Nadu", 13.1143, 80.1548, "Industrial", 0.45),
    ("North Gate, Visakhapatnam, India", "Visakhapatnam", "Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, "Residential", 0.38),
    ("AutoNagar Belt, Vijayawada, India", "Vijayawada", "Krishna", "Andhra Pradesh", 16.5062, 80.6480, "Industrial", 0.8),
    ("Hardware Park, Hyderabad, India", "Hyderabad", "Ranga Reddy", "Telangana", 17.2409, 78.5245, "Industrial", 0.7),
    ("ORR West Node, Hyderabad, India", "Hyderabad", "Medchal", "Telangana", 17.4933, 78.3570, "Commercial", 0.5),
]

ZONINGS = ["Agricultural", "Residential", "Commercial", "Industrial", "Conservation"]

def draw_applicable(p=0.65):
    return "applicable" if random.random() < p else "notApplicable"

def draw_distance(applicable, low=0.1, high=2.5):
    if applicable == "notApplicable": return ""
    return round(random.uniform(low, high), 2)

def base_price_per_acre(zone, city_weight):
    # Simple zone pricing model (INR per acre)
    base = {
        "Agricultural": 22e5,
        "Residential": 60e5,
        "Commercial": 95e5,
        "Industrial": 75e5,
        "Conservation": 18e5
    }[zone]
    return base * city_weight

def city_weight(city):
    # Coarse city factor (adjust freely)
    return {
        "Chennai": 1.40,
        "Coimbatore": 1.15,
        "Madurai": 1.05,
        "Visakhapatnam": 1.10,
        "Vijayawada": 1.05,
        "Hyderabad": 1.35
    }.get(city, 1.00)

def amenity_discount(water_a, road_a, school_a, rail_a, bus_a):
    # Amenities reduce travel time / increase value: up to +12%
    bump = 0
    if water_a == "applicable": bump += 0.02
    if road_a  == "applicable": bump += 0.04
    if school_a== "applicable": bump += 0.01
    if rail_a  == "applicable": bump += 0.02
    if bus_a   == "applicable": bump += 0.03
    return 1.0 + min(bump, 0.12)

def year_trend(year):
    # 5-year trend factor; later years slightly more expensive
    now = datetime.utcnow().year
    delta = year - (now - 4)  # map to 0..4
    return 1.0 + 0.03 * max(0, min(4, delta))

def jitter(x, pct=0.08):
    return x * random.uniform(1 - pct, 1 + pct)

def rows_for_parcel(parcel, start_year, count_per_parcel=40):
    loc, city, dist, state, lat, lng, zone, base_area = parcel
    rows = []
    for i in range(count_per_parcel):
        year = random.randint(start_year, start_year + 4)  # last 5 years window
        # Vary area slightly per transaction to simulate subdividing/merging
        area = max(0.1, jitter(base_area, pct=0.25))

        # Amenities
        waterA = draw_applicable(0.75)
        roadA  = draw_applicable(0.85)
        schoolA= draw_applicable(0.55)
        railA  = draw_applicable(0.45)
        busA   = draw_applicable(0.70)

        waterD = draw_distance(waterA, 0.2, 1.8)
        roadD  = draw_distance(roadA, 0.1, 1.0)
        schoolD= draw_distance(schoolA, 0.5, 3.0)
        railD  = draw_distance(railA, 2.0, 12.0)
        busD   = draw_distance(busA, 0.2, 2.0)

        # Price model
        cz = zone if random.random() > 0.25 else random.choice(ZONINGS)  # occasional zone change
        cweight = city_weight(city)
        ppa = base_price_per_acre(cz, cweight)              # base price/acre
        amen_adj = amenity_discount(waterA, roadA, schoolA, railA, busA)
        year_adj = year_trend(year)
        price = ppa * area * amen_adj * year_adj
        price = int(round(jitter(price, 0.12)))  # final noise and int

        rows.append([
            loc, city, dist, state, year,
            round(area, 4), cz, round(lat, 6), round(lng, 6),
            waterA, waterD, roadA, roadD, schoolA, schoolD, railA, railD, busA, busD,
            price
        ])
    return rows

def main():
    now = datetime.utcnow().year
    start_year = now - 4  # last 5 years inclusive

    # Determine rows per parcel so total ≈ 500
    per_parcel = max(10, int(math.ceil(500 / len(PARCELS))))
    all_rows = []
    for p in PARCELS:
        all_rows.extend(rows_for_parcel(p, start_year, count_per_parcel=per_parcel))

    # Trim to exactly 500
    random.shuffle(all_rows)
    all_rows = all_rows[:500]

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(all_rows)

    print(f"Wrote {len(all_rows)} rows to {OUT}")

if __name__ == "__main__":
    main()
