import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../MapComponent";
import "./HousePredictionForm.css";

export default function HousePredictionForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    location: "",
    Area_sqft: "",
    areaUnit: "sqft", // sqft | acres
    Property_Type: "",
    Bedrooms: "",
    Bathrooms: "",
    Year_Built: "",
    Condition: "",
    latitude: "",
    longitude: "",

    // Amenities
    hospitalApplicable: "notApplicable",
    hospitalDistance: "",
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toSqft = (value, unit) => {
    const v = Number(value) || 0;
    return unit === "acres" ? v * 43560 : v;
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
  const handleLocationChange = (e) => {
    handleChange(e);
    const value = e.target.value;
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
  };

  // -------- Use current GPS location --------

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setForm((prev) => ({ ...prev, latitude, longitude }));

        const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        try {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`
          );
          const data = await resp.json();
          if (data.status === "OK") {
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

  // -------- Build payload for prediction --------

  const buildPayload = () => {
    const sqft = toSqft(form.Area_sqft, form.areaUnit);
    return {
      // location and geo
      location: form.location || "",
      latitude: Number(form.latitude) || Number(coordinates.lat) || 0,
      longitude: Number(form.longitude) || Number(coordinates.lng) || 0,

      // area normalized
      Area_sqft: Number(sqft) || 0,

      // property attributes
      Property_Type: form.Property_Type || "",
      Bedrooms: Number(form.Bedrooms) || 0,
      Bathrooms: Number(form.Bathrooms) || 0,
      Year_Built: Number(form.Year_Built) || 0,
      Condition: form.Condition || "",

      // amenities
      hospitalApplicable: form.hospitalApplicable || "notApplicable",
      hospitalDistance: Number(form.hospitalDistance) || 0,
      schoolApplicable: form.schoolApplicable || "notApplicable",
      schoolDistance: Number(form.schoolDistance) || 0,
      railwayApplicable: form.railwayApplicable || "notApplicable",
      railwayDistance: Number(form.railwayDistance) || 0,
      busApplicable: form.busApplicable || "notApplicable",
      busDistance: Number(form.busDistance) || 0,
    };
  };

  // -------- Predict API call --------

  const predict = useCallback(async () => {
    const payload = buildPayload();
    try {
      const response = await fetch(
        `${process.env.REACT_APP_HOUSE_API}/predict/house`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      const price = Number(data.price);
      setResult(price);
      if (payload.Area_sqft > 0 && Number.isFinite(price)) {
        setPerSqft(Number((price / payload.Area_sqft).toFixed(2)));
      } else {
        setPerSqft(undefined);
      }

      const logPayload = {
        ...payload,
        Predicted_Price: price,
        Date: new Date().toISOString(),
      };
      if (process.env.REACT_APP_BACKEND_URL) {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/submit/house`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logPayload),
        }).catch(() => {});
      }
    } catch {
      setResult(undefined);
      setPerSqft(undefined);
      alert("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form, coordinates.lat, coordinates.lng]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // IMPORTANT: do not overwrite coordinates again here.
    // We trust what is already in coordinates/form from the map or geocoding.
    await predict();
  };

  // -------- Auto-predict on change (optional) --------

  useEffect(() => {
    const t = setTimeout(() => {
      if (form.location && form.Area_sqft && form.Property_Type) {
        setLoading(true);
        predict();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [
    form.location,
    form.Area_sqft,
    form.areaUnit,
    form.Property_Type,
    form.Bedrooms,
    form.Bathrooms,
    form.Year_Built,
    form.Condition,
    form.latitude,
    form.longitude,
    form.hospitalApplicable,
    form.hospitalDistance,
    form.schoolApplicable,
    form.schoolDistance,
    form.railwayApplicable,
    form.railwayDistance,
    form.busApplicable,
    form.busDistance,
    predict,
  ]);

  // -------- Open exact marker in Google Maps --------

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
    <div className="house-predict-root">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="house-predict-panels">
        {/* Left panel */}
        <div className="property-details-card">
          <div className="property-header">
            <span className="icon">
              <img src="/icons/house.png" alt="" />
            </span>
            <span className="property-title">Property Details</span>
          </div>
          <div className="property-desc">
            Enter the details of the house to get an accurate price prediction
          </div>

          <form onSubmit={handleSubmit} className="property-form">
            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="input-with-icon">
                <span className="input-icon">📍</span>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g., Street, City, District"
                  value={form.location}
                  onChange={handleLocationChange}
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

            {/* Map */}
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

              <button
                type="button"
                className="maps-live-btn"
                onClick={handleOpenInMaps}
                style={{ marginTop: 8 }}
              >
                View on Google Maps
              </button>
            </div>

            {/* Area + Unit */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area</label>
                <input
                  name="Area_sqft"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1500"
                  value={form.Area_sqft}
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
                  <option value="sqft">Square Feet</option>
                  <option value="acres">Acres</option>
                </select>
              </div>
            </div>

            {/* Property attributes */}
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select
                name="Property_Type"
                value={form.Property_Type}
                onChange={handleChange}
                required
              >
                <option value="">Select type</option>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Independent House</option>
                <option>Duplex</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <select
                  name="Bedrooms"
                  value={form.Bedrooms}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <select
                  name="Bathrooms"
                  value={form.Bathrooms}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year Built</label>
                <input
                  name="Year_Built"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="2015"
                  value={form.Year_Built}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select
                  name="Condition"
                  value={form.Condition}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Needs Renovation</option>
                </select>
              </div>
            </div>

            {/* Amenities */}
            <div className="form-group">
              <div className="facility-label">Hospital</div>
              <div className="facility-radios">
                <label>
                  <input
                    type="radio"
                    name="hospitalApplicable"
                    value="applicable"
                    checked={form.hospitalApplicable === "applicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hospitalApplicable: e.target.value,
                        hospitalDistance: "",
                      }))
                    }
                  />
                  Applicable
                </label>
                <label>
                  <input
                    type="radio"
                    name="hospitalApplicable"
                    value="notApplicable"
                    checked={form.hospitalApplicable === "notApplicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hospitalApplicable: e.target.value,
                        hospitalDistance: "",
                      }))
                    }
                  />
                  Not Applicable
                </label>
              </div>
              {form.hospitalApplicable === "applicable" && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Distance from hospital (km)"
                  name="hospitalDistance"
                  value={form.hospitalDistance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hospitalDistance: e.target.value,
                    }))
                  }
                  required
                />
              )}
            </div>

            <div className="form-group">
              <div className="facility-label">School</div>
              <div className="facility-radios">
                <label>
                  <input
                    type="radio"
                    name="schoolApplicable"
                    value="applicable"
                    checked={form.schoolApplicable === "applicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        schoolApplicable: e.target.value,
                        schoolDistance: "",
                      }))
                    }
                  />
                  Applicable
                </label>
                <label>
                  <input
                    type="radio"
                    name="schoolApplicable"
                    value="notApplicable"
                    checked={form.schoolApplicable === "notApplicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        schoolApplicable: e.target.value,
                        schoolDistance: "",
                      }))
                    }
                  />
                  Not Applicable
                </label>
              </div>
              {form.schoolApplicable === "applicable" && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Distance from school (km)"
                  name="schoolDistance"
                  value={form.schoolDistance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      schoolDistance: e.target.value,
                    }))
                  }
                  required
                />
              )}
            </div>

            <div className="form-group">
              <div className="facility-label">Railway Station</div>
              <div className="facility-radios">
                <label>
                  <input
                    type="radio"
                    name="railwayApplicable"
                    value="applicable"
                    checked={form.railwayApplicable === "applicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        railwayApplicable: e.target.value,
                        railwayDistance: "",
                      }))
                    }
                  />
                  Applicable
                </label>
                <label>
                  <input
                    type="radio"
                    name="railwayApplicable"
                    value="notApplicable"
                    checked={form.railwayApplicable === "notApplicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        railwayApplicable: e.target.value,
                        railwayDistance: "",
                      }))
                    }
                  />
                  Not Applicable
                </label>
              </div>
              {form.railwayApplicable === "applicable" && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Distance from railway station (km)"
                  name="railwayDistance"
                  value={form.railwayDistance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      railwayDistance: e.target.value,
                    }))
                  }
                  required
                />
              )}
            </div>

            <div className="form-group">
              <div className="facility-label">Bus Stand</div>
              <div className="facility-radios">
                <label>
                  <input
                    type="radio"
                    name="busApplicable"
                    value="applicable"
                    checked={form.busApplicable === "applicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        busApplicable: e.target.value,
                        busDistance: "",
                      }))
                    }
                  />
                  Applicable
                </label>
                <label>
                  <input
                    type="radio"
                    name="busApplicable"
                    value="notApplicable"
                    checked={form.busApplicable === "notApplicable"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        busApplicable: e.target.value,
                        busDistance: "",
                      }))
                    }
                  />
                  Not Applicable
                </label>
              </div>
              {form.busApplicable === "applicable" && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Distance from bus stand (km)"
                  name="busDistance"
                  value={form.busDistance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      busDistance: e.target.value,
                    }))
                  }
                  required
                />
              )}
            </div>

            <button className="predict-btn" type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict House Price"}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div className="price-prediction-card">
          <div className="price-header">
            <span className="price-icon">₹</span>
            <span className="price-title">Price Prediction</span>
          </div>
          <div className="price-desc">
            Your estimated house price will appear here
          </div>
          <div className="price-output">
            {Number.isFinite(result) ? (
              <div className="price-result">
                <span className="result-value">{formatINR(result)}</span>
                {Number.isFinite(perSqft) && (
                  <div className="price-sub">
                    ≈ ₹{perSqft.toLocaleString("en-IN")} / sqft
                  </div>
                )}
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
