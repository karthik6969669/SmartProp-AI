import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../MapComponent";
import "./SellHouseForm.css";

export default function SellHouseForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    location: "",
    city: "",
    actualPrice: "",
    contact: "",             // NEW
    Area_sqft: "",
    areaUnit: "sqft",
    Property_Type: "",
    Bedrooms: "",
    Bathrooms: "",
    Year_Built: "",
    Condition: "",
    latitude: "",
    longitude: "",
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
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setForm((prev) => ({ ...prev, latitude, longitude }));
        try {
          const geoApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${geoApiKey}`
          );
          const data = await resp.json();
          if (data.status === "OK" && data.results.length > 0) {
            const rooftop = data.results.find(
              (r) => r.geometry?.location_type === "ROOFTOP"
            );
            const formatted = (rooftop || data.results[0]).formatted_address || "";
            setForm((prev) => ({ ...prev, location: formatted }));
            setError("");
          } else {
            setError(`Failed to fetch address (${data.status}). Please type it manually.`);
          }
        } catch {
          setError("Unable to fetch address. Check internet connection.");
        }
      },
      () => setError("Permission denied or unable to get location.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Contact must be exactly 10 digits
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

    const payload = {
      ...form,
      Area_sqft: areaInSqft,
    };
    delete payload.areaUnit;

    const data = new FormData();
    Object.keys(payload).forEach((key) => data.append(key, payload[key]));
    images.forEach((img) => data.append("images", img));

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/sell/house`, {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setSuccess("Your property has been listed!");
        setError("");
        setImages([]);
        setForm({
          location: "",
          city: "",
          actualPrice: "",
          contact: "",        // reset
          Area_sqft: "",
          areaUnit: "sqft",
          Property_Type: "",
          Bedrooms: "",
          Bathrooms: "",
          Year_Built: "",
          Condition: "",
          latitude: "",
          longitude: "",
          hospitalApplicable: "notApplicable",
          hospitalDistance: "",
          schoolApplicable: "notApplicable",
          schoolDistance: "",
          railwayApplicable: "notApplicable",
          railwayDistance: "",
          busApplicable: "notApplicable",
          busDistance: "",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to submit.");
      }
    } catch {
      setError("Network error or server error!");
    }
  };

  const renderFacility = (label, applicableName, distanceName) => (
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
            <img src="/icons/house.png" alt="" />
          </span>
          <span className="property-title">Sell Your House</span>
        </div>
        <form onSubmit={handleSubmit} className="property-form" encType="multipart/form-data">
          <div className="form-group">
            <label className="form-label">Location</label>
            <div className="input-with-icon">
              <span className="input-icon">📍</span>
              <input
                name="location"
                type="text"
                placeholder="e.g., Downtown, Suburb Name"
                value={form.location}
                onChange={handleChange}
                required
              />
              <button type="button" className="location-btn" onClick={getCurrentLocation}>
                Use My Location
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              name="city"
              type="text"
              placeholder="Enter city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area</label>
              <input
                name="Area_sqft"
                type="number"
                min="0"
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

          {renderFacility("Hospital", "hospitalApplicable", "hospitalDistance")}
          {renderFacility("School", "schoolApplicable", "schoolDistance")}
          {renderFacility("Railway Station", "railwayApplicable", "railwayDistance")}
          {renderFacility("Bus Stand", "busApplicable", "busDistance")}

          <div className="form-group">
            <label className="form-label">Actual Price (INR)</label>
            <input
              name="actualPrice"
              type="number"
              min="0"
              placeholder="Eg. 4500000"
              value={form.actualPrice}
              onChange={handleChange}
              required
            />
          </div>

          {/* NEW: Contact number */}
          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input
              name="contact"
              type="tel"
              placeholder="10-digit number"
              value={form.contact}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm({ ...form, contact: digitsOnly });
              }}
              pattern="\d{10}"
              minLength={10}
              maxLength={10}
              inputMode="numeric"
              required
            />
            <small>Enter exactly 10 digits</small>
          </div>
              
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
            {images.length > 0 && <span>{images.map(f => f.name).join(", ")}</span>}
          </div>

          <small>(Upload 1-3 property images)</small>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button className="predict-btn" type="submit">
            Submit Listing
          </button>
        </form>
      </div>
    </div>
  );
}
