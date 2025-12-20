import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../MapComponent";
import "./SellHouseForm.css"; // reuse same styles

export default function SellLandForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    location: "",
    state: "",
    district: "",
    city: "",

    Area_sqft: "",
    areaUnit: "sqft", // sqft | acres
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

    actualPrice: "",
    contact: "",
  });

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 1 || files.length > 3) {
      setError("Upload 1-3 images.");
      return;
    }
    setImages(files);
    setError("");
  };

  const getCurrentLocation = async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported!");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setForm((prev) => ({ ...prev, latitude, longitude }));
        try {
          const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
          const r = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`
          );
          const d = await r.json();
          if (d.status === "OK" && d.results.length) {
            const rooftop = d.results.find(
              (x) => x.geometry?.location_type === "ROOFTOP"
            );
            const formatted = (rooftop || d.results[0]).formatted_address || "";
            setForm((prev) => ({ ...prev, location: formatted }));
            setError("");
          } else {
            setError(`Failed to fetch address (${d.status}). Please type it manually.`);
          }
        } catch {
          setError("Unable to fetch address. Check internet connection.");
        }
      },
      () => setError("Permission denied or unable to get location.")
    );
  };

  const toSqft = (value, unit) => {
    const v = Number(value) || 0;
    return unit === "acres" ? v * 43560 : v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{10}$/.test(form.contact)) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }
    if (images.length < 1 || images.length > 3) {
      setError("Upload 1-3 images.");
      return;
    }

    let areaInSqft = Number(form.Area_sqft);
    if (form.areaUnit === "acres") areaInSqft *= 43560;

    const payload = { ...form, Area_sqft: areaInSqft };
    delete payload.areaUnit;

    const data = new FormData();
    Object.keys(payload).forEach((k) => data.append(k, payload[k] ?? ""));
    images.forEach((img) => data.append("images", img));

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/sell/land`, {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setSuccess("Your land has been listed!");
        setError("");
        setImages([]);
        setForm({
          location: "",
          state: "",
          district: "",
          city: "",
          Area_sqft: "",
          areaUnit: "sqft",
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
          actualPrice: "",
          contact: "",
        });
        // Navigate to Buy Land to see the new card
        setTimeout(() => navigate("/buy-land"), 400);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to submit.");
      }
    } catch {
      setError("Network error or server error!");
    }
  };

  const renderAmenity = (label, applicableName, distanceName) => (
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
          step="0.1"
          placeholder={`Distance from ${label.toLowerCase()} (km)`}
          name={distanceName}
          value={form[distanceName]}
          onChange={handleChange}
          required
        />
      )}
    </div>
  );

  return (
    <div className="sell-house-root">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="property-details-card">
        <div className="property-header">
          <span className="icon">
            <img src="/icons/land.png" alt="" />
          </span>
          <span className="property-title">Sell Your Land</span>
        </div>

        <form onSubmit={handleSubmit} className="property-form" encType="multipart/form-data">
          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <div className="input-with-icon">
              <span className="input-icon">📍</span>
              <input
                name="location"
                type="text"
                placeholder="e.g., Village, Taluk"
                value={form.location}
                onChange={handleChange}
                required
              />
              <button type="button" className="location-btn" onClick={getCurrentLocation}>
                Use My Location
              </button>
            </div>
          </div>

          {/* State/District/City aligned in one row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                name="state"
                type="text"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <input
                name="district"
                type="text"
                placeholder="District"
                value={form.district}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                name="city"
                type="text"
                placeholder="City / Village"
                value={form.city}
                onChange={handleChange}
              />
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
          </div>

          {/* Area + Unit aligned */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area</label>
              <input
                name="Area_sqft"
                type="number"
                min="0"
                placeholder="4356"
                value={form.Area_sqft}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select name="areaUnit" value={form.areaUnit} onChange={handleChange} required>
                <option value="sqft">Square Feet</option>
                <option value="acres">Acres</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Zoning</label>
              <select name="zoning" value={form.zoning} onChange={handleChange}>
                <option value="">Select zoning</option>
                <option>Agricultural</option>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
              </select>
            </div>
          </div>

          {/* Amenities */}
          {renderAmenity("Water", "waterApplicable", "waterDistance")}
          {renderAmenity("Road", "roadApplicable", "roadDistance")}
          {renderAmenity("School", "schoolApplicable", "schoolDistance")}
          {renderAmenity("Railway Station", "railwayApplicable", "railwayDistance")}
          {renderAmenity("Bus Stand", "busApplicable", "busDistance")}

          {/* Price and Contact */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Asking Price (INR)</label>
              <input
                name="actualPrice"
                type="number"
                min="0"
                placeholder="Eg. 800000"
                value={form.actualPrice}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                name="contact"
                type="tel"
                placeholder="10-digit number"
                value={form.contact}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((prev) => ({ ...prev, contact: digits }));
                }}
                pattern="\d{10}"
                minLength={10}
                maxLength={10}
                inputMode="numeric"
                required
              />
              <small>Enter exactly 10 digits</small>
            </div>
          </div>

          {/* Images */}
          <div className="form-group">
            <label>Upload Images (1 to 3)</label>
            <label className="custom-file-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                required
                style={{ display: "none" }}
              />
              <span>📷 Choose Images</span>
            </label>
          </div>

          <div className="selected-files">
            {images.length > 0 && <span>{images.map((f) => f.name).join(", ")}</span>}
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button className="predict-btn" type="submit">
            Submit Land Listing
          </button>
        </form>
      </div>
    </div>
  );
}
