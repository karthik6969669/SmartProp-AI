import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../MapComponent";
import "./LandPredictionForm.css";

export default function LandPredictionForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    location: "",
    area: "",
    areaUnit: "acres",
    zoning: "",
    latitude: "",
    longitude: "",

    waterApplicable: "notApplicable",
    waterDistance: "",
    roadApplicable: "notApplicable",
    roadDistance: "",
    schoolApplicable: "notApplicable",
    schoolDistance: "",
    railwayApplicable: "notApplicable",
    railwayDistance: "",
    busApplicable: "notApplicable",
    busDistance: "",
  });

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [result, setResult] = useState();
  const [perSqft, setPerSqft] = useState();
  const [perCent, setPerCent] = useState();
  const [loading, setLoading] = useState(false);

  // Convert UI unit to acres for backend
  const toAcres = (value, unit) => {
    const v = Number(value) || 0;
    switch (unit) {
      case "acres":
        return v;
      case "sqft":
        return v / 43560;
      case "sqm":
        return v / 4046.8564224;
      case "hectares":
        return v * 2.4710538147;
      default:
        return v;
    }
  };

  const formatINR = (n) => {
    const v = Number(n);
    if (!isFinite(v)) return "—";
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  // -------- Geocoding helpers (for typing address) --------

  const geocodeAddress = async (address) => {
    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!key || !address) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${key}`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (d.status === "OK" && d.results.length) {
        const { lat, lng } = d.results[0].geometry.location;
        return { lat, lng };
      }
    } catch {
      // ignore
    }
    return null;
  };

  let geocodeTimer = null;
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "location") {
      if (geocodeTimer) clearTimeout(geocodeTimer);
      geocodeTimer = setTimeout(async () => {
        const coords = await geocodeAddress(value);
        if (coords) {
          setCoordinates(coords);
          setForm((prev) => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng,
          }));
        }
      }, 500);
    }
  };

  // -------- Use current GPS location --------

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation unsupported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setForm((prev) => ({ ...prev, latitude, longitude }));

        const geoApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        try {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${geoApiKey}`
          );
          const data = await resp.json();
          if (data.status === "OK" && data.results.length) {
            const rooftopResult = data.results.find(
              (r) => r.geometry.location_type === "ROOFTOP"
            );
            setForm((prev) => ({
              ...prev,
              location: (rooftopResult || data.results[0]).formatted_address,
            }));
          } else {
            alert(
              `Failed to get address: ${data.status}${
                data.error_message ? " - " + data.error_message : ""
              }`
            );
          }
        } catch {
          alert("Error fetching location address.");
        }
      },
      () => alert("Permission denied or unable to get location."),
      { enableHighAccuracy: true }
    );
  };

  // -------- Extract City & District --------

  const extractCityDistrict = (location) => {
    if (!location) {
      return { city: "", district: "" };
    }
    const parts = location
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    let city = "";
    let district = "";
    if (parts.length >= 2) {
      city = parts[parts.length - 2];
      district = parts[parts.length - 1];
    } else if (parts.length === 1) {
      city = parts[0];
      district = parts[0];
    }
    const norm = (s) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    return { city: norm(city), district: norm(district) };
  };

  // -------- Build payload for prediction --------

  const buildPayload = () => {
    const areaInAcres = toAcres(form.area, form.areaUnit);
    const { city, district } = extractCityDistrict(form.location);
    return {
      location: form.location || "",
      area: Number(areaInAcres) || 0, // always acres
      zoning: form.zoning || "",
      latitude: Number(form.latitude) || Number(coordinates.lat) || 0,
      longitude: Number(form.longitude) || Number(coordinates.lng) || 0,

      City: city,
      District: district,

      waterApplicable: form.waterApplicable || "notApplicable",
      waterDistance: Number(form.waterDistance) || 0,
      roadApplicable: form.roadApplicable || "notApplicable",
      roadDistance: Number(form.roadDistance) || 0,
      schoolApplicable: form.schoolApplicable || "notApplicable",
      schoolDistance: Number(form.schoolDistance) || 0,
      railwayApplicable: form.railwayApplicable || "notApplicable",
      railwayDistance: Number(form.railwayDistance) || 0,
      busApplicable: form.busApplicable || "notApplicable",
      busDistance: Number(form.busDistance) || 0,
      Area_sqft: form.areaUnit === "sqft" ? Number(form.area) || 0 : 0,
    };
  };

  const predict = async () => {
    const payload = buildPayload();
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_LAND_API}/predict/land`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      setResult(Number(data.price));
      setPerSqft(data.price_per_sqft ?? undefined);
      setPerCent(data.price_per_cent ?? undefined);
    } catch {
      setResult(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(undefined);
    await predict();
  };

  // -------- Auto-predict when key inputs change --------

  useEffect(() => {
    const t = setTimeout(() => {
      if (form.location && form.area && form.zoning) {
        predict();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [
    form.location,
    form.area,
    form.areaUnit,
    form.zoning,
    form.latitude,
    form.longitude,
    form.waterApplicable,
    form.waterDistance,
    form.roadApplicable,
    form.roadDistance,
    form.schoolApplicable,
    form.schoolDistance,
    form.railwayApplicable,
    form.railwayDistance,
    form.busApplicable,
    form.busDistance,
  ]);

  // -------- View on Google Maps (Go Live) --------

  const buildMapsUrl = () => {
    const lat = coordinates.lat != null ? Number(coordinates.lat) : null;
    const lng = coordinates.lng != null ? Number(coordinates.lng) : null;
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${lat},${lng}`
      )}`;
    }
    return null;
  };

  const handleOpenInMaps = () => {
    const url = buildMapsUrl();
    if (!url) {
      alert("Please pick a location on the map or use your location first.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // -------- UI --------

  return (
    <div className="land-predict-root">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="land-predict-panels">
        {/* Left panel: details */}
        <div className="land-details-card">
          <div className="details-header">
            <span className="icon">
              <img src="/icons/land.png" alt="Land" />
            </span>
            <span className="details-title">Land Details</span>
          </div>

          <div className="details-desc">
            Enter the details of the land to get an accurate price prediction
          </div>

          <form onSubmit={handleSubmit} className="details-form">
            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="input-with-icon">
                <span className="input-icon">📍</span>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g., Village, City, District"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="location-btn"
                  onClick={getCurrentLocation}
                >
                  Use My Location
                </button>
              </div>
            </div>

            {/* Map picker */}
            <div className="form-group">
              <label className="form-label">Choose Location on Map:</label>
              <MapComponent
                lat={coordinates.lat}
                lng={coordinates.lng}
                onLocationSelect={(lat, lng) => {
                  setCoordinates({ lat, lng });
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
                }}
              />
              {coordinates.lat && coordinates.lng && (
                <div style={{ fontSize: "0.9em", marginTop: 4 }}>
                  Selected: {coordinates.lat}, {coordinates.lng}
                </div>
              )}

              {/* Go Live button */}
              <button
                type="button"
                className="maps-live-btn"
                onClick={handleOpenInMaps}
                style={{ marginTop: 8 }}
              >
                View on Google Maps
              </button>
            </div>

            {/* Area + Unit row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area</label>
                <input
                  name="area"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2.5"
                  value={form.area}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  name="areaUnit"
                  value={form.areaUnit}
                  onChange={handleChange}
                  required
                >
                  <option value="acres">Acres</option>
                  <option value="sqft">Square Feet</option>
                  <option value="sqm">Square Meters</option>
                  <option value="hectares">Hectares</option>
                </select>
              </div>
            </div>

            {/* Zoning */}
            <div className="form-group">
              <label className="form-label">Zoning Type</label>
              <select
                name="zoning"
                value={form.zoning}
                onChange={handleChange}
                required
              >
                <option value="">Select zoning</option>
                <option>Agricultural</option>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
                <option>Conservation</option>
              </select>
            </div>

            {/* Facilities */}
            {[
              "Water Service",
              "Road Access",
              "School",
              "Railway Station",
              "Bus Stand",
            ].map((label, idx) => {
              const mapNames = [
                ["waterApplicable", "waterDistance"],
                ["roadApplicable", "roadDistance"],
                ["schoolApplicable", "schoolDistance"],
                ["railwayApplicable", "railwayDistance"],
                ["busApplicable", "busDistance"],
              ][idx];
              const [applicableName, distanceName] = mapNames;
              return (
                <div className="form-group" key={applicableName}>
                  <div className="facility-label">{label}</div>
                  <div className="facility-radios">
                    <label>
                      <input
                        type="radio"
                        name={applicableName}
                        value="applicable"
                        checked={form[applicableName] === "applicable"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [applicableName]: e.target.value,
                            [distanceName]: "",
                          }))
                        }
                      />
                      Applicable
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={applicableName}
                        value="notApplicable"
                        checked={form[applicableName] === "notApplicable"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [applicableName]: e.target.value,
                            [distanceName]: "",
                          }))
                        }
                      />
                      Not Applicable
                    </label>
                  </div>
                  {form[applicableName] === "applicable" && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Distance from ${label.toLowerCase()} (km)`}
                      value={form[distanceName]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [distanceName]: e.target.value,
                        }))
                      }
                      required
                    />
                  )}
                </div>
              );
            })}

            <button className="predict-btn" type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict Land Price"}
            </button>
          </form>
        </div>

        {/* Right panel: price card */}
        <div className="price-prediction-card">
          <div className="price-header">
            <span className="price-icon">₹</span>
            <span className="price-title">Price Prediction</span>
          </div>
          <div className="price-desc">
            Your estimated land price will appear here
          </div>
          <div className="price-output">
            {Number.isFinite(result) ? (
              <div className="price-result">
                <span className="result-value">{formatINR(result)}</span>
                <div className="price-sub">
                  {Number.isFinite(perSqft) && (
                    <div>{`≈ ₹${perSqft.toLocaleString(
                      "en-IN"
                    )} / sqft`}</div>
                  )}
                  {Number.isFinite(perCent) && (
                    <div>{`≈ ₹${perCent.toLocaleString(
                      "en-IN"
                    )} / cent`}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="result-placeholder">
                <span className="result-calc-icon">🧮</span>
                <span>Fill out the form to see your price prediction</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
