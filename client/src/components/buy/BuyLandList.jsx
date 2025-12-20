import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BuyLandList.css";

function formatCurrencyINR(n) {
  if (n == null || isNaN(n)) return "₹0.00";
  const v = Number(n);
  if (v <= 0) return "₹0.00";
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

// Build Google Maps URL from coordinates or address
const buildMapsUrl = (land) => {
  // If you store coordinates, prefer using them
  if (land.latitude && land.longitude) {
    const lat = land.latitude;
    const lng = land.longitude;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
  }

  // Fallback: use text address (location, city, district, state)
  const parts = [
    land.location,
    land.city,
    land.district,
    land.state,
    land.country || "India",
  ].filter(Boolean);

  const query = parts.join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
};

export default function BuyLandList() {
  const navigate = useNavigate();

  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState({});
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const openLightbox = (src) => setLightboxSrc(src);
  const closeLightbox = () => setLightboxSrc(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/buy/lands`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLands(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr("Unable to fetch land listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    if (lightboxSrc) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  const num = (x, def = 0) => {
    const v = Number(x);
    return Number.isFinite(v) ? v : def;
  };

  const goDetails = (land) => navigate(`/land/${land.id}`);

  const handleGoLive = (land) => {
    const url = buildMapsUrl(land);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading)
    return <div className="buy-loading">Loading land listings...</div>;
  if (err) return <div className="buy-error">{err}</div>;
  if (!lands.length)
    return <div className="buy-empty">No land listings found.</div>;

  return (
    <div className="buy-root land">
      {lands.map((l) => {
        const isRevealed = revealed[l.id];
        const actual = l.actualPrice != null ? Number(l.actualPrice) : 0;
        const areaSqft = num(l.area_sqft, 0);

        return (
          <div className="buy-card" key={l.id}>
            {/* Left: image */}
            <div className="buy-card-left">
              <div className="buy-thumb">
                {l.image ? (
                  <button
                    type="button"
                    className="thumb-click"
                    onClick={() =>
                      openLightbox(
                        `${process.env.REACT_APP_BACKEND_URL}${l.image}`
                      )
                    }
                    aria-label="View full image"
                  >
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${l.image}`}
                      alt=""
                    />
                  </button>
                ) : (
                  <div className="no-img">No Image</div>
                )}
                <span className="badge">Land</span>
              </div>
            </div>

            {/* Middle: meta */}
            <div className="buy-card-mid">
              <div className="buy-title">
                {l.zoning || "Land"} in{" "}
                {l.city || l.district || l.state || l.location || ""}
              </div>

              <div className="buy-meta">
                <div className="price">{formatCurrencyINR(actual)}</div>
                <div className="meta-item">
                  {areaSqft > 0
                    ? `${areaSqft.toLocaleString()} sq.ft`
                    : "—"}
                </div>
                {l.zoning && <div className="meta-item">{l.zoning}</div>}
              </div>

              {(l.location || l.city || l.district || l.state) && (
                <div className="location-row">
                  <span className="pin">📍</span>
                  <span className="loc-text">
                    {l.location ||
                      [l.city, l.district, l.state]
                        .filter(Boolean)
                        .join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="buy-card-right">
              <div className="btn-row">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setRevealed((r) => ({ ...r, [l.id]: !isRevealed }))
                  }
                >
                  {isRevealed ? l.contact || "NA" : "Contact"}
                </button>

                <button
                  className="btn details"
                  onClick={() => goDetails(l)}
                  title="View full details"
                >
                  Go Details
                </button>

                {/* NEW: Go Live button */}
                <button
                  className="btn go-live"
                  onClick={() => handleGoLive(l)}
                  title="Open this land location in Google Maps"
                >
                  Go Live
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Full-screen lightbox */}
      {lightboxSrc && (
        <div
          className="lb-overlay lb-full"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="lb-content lb-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lb-close"
              onClick={closeLightbox}
              aria-label="Close"
            >
              ×
            </button>
            <img src={lightboxSrc} alt="" />
          </div>
        </div>
      )}
    </div>
  );
}
