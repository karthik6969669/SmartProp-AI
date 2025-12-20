import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./BuyHouseList.css";

function formatCurrencyINR(value) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) return "₹0.00";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Build Google Maps url from lat/lng or address string
const buildMapsUrl = (house) => {
  // If you store coordinates in DB, prefer this:
  if (house.latitude && house.longitude) {
    const lat = house.latitude;
    const lng = house.longitude;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
  }

  // Fallback to full address/location text
  const parts = [
    house.location,
    house.city,
    house.state,           // if you have
    house.country || "India",
  ].filter(Boolean);

  const query = parts.join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
};

export default function BuyHouseList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cityFilter = searchParams.get("city");

  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState({});
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const openLightbox = useCallback((src) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/buy/houses`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        let filtered = list;
        if (cityFilter && cityFilter.trim()) {
          const raw = cityFilter.trim().toLowerCase();
          const normalize = (t) =>
            String(t || "")
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/[-_]/g, "")
              .replace(/[^a-z0-9]/gi, "");

          const needle = normalize(raw);
          filtered = list.filter((h) => {
            const city = String(h.city || "").toLowerCase();
            const loc = String(h.location || "").toLowerCase();
            if (city.includes(raw) || loc.includes(raw)) return true;
            return (
              normalize(h.city).includes(needle) ||
              normalize(h.location).includes(needle)
            );
          });
        }

        setHouses(filtered);
      } catch (e) {
        console.error("Fetch error:", e);
        setErr("Unable to fetch listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cityFilter]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    if (lightboxSrc) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc, closeLightbox]);

  const goDetails = (h) => {
    const k = h._id || h.id;
    navigate(`/house/${k}`);
  };

  const handleGoLive = (house) => {
    const url = buildMapsUrl(house);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="buy-loading">Loading listings...</div>;
  if (err) return <div className="buy-error">{err}</div>;

  return (
    <div className="buy-root">
      {cityFilter && (
        <div className="filter-header">
          <h2>
            Houses in <span className="city-name">{cityFilter}</span>
          </h2>
          <a href="/buy-house" className="clear-filter">
            ✕ Clear Filter
          </a>
        </div>
      )}

      {!houses.length ? (
        <div className="buy-empty">
          {cityFilter
            ? `No houses found in "${cityFilter}". Try a different city.`
            : "No houses found."}
        </div>
      ) : (
        houses.map((h) => {
          const k = h._id || h.id;
          const isRevealed = revealed[k];

          const actualPriceNum = num(h.actualPrice, 0);
          const areaNum = num(h.area_sqft, 0);
          const bedsNum = num(h.bedrooms, 0);
          const bathsNum = num(h.bathrooms, 0);

          return (
            <div className="buy-card" key={k}>
              {/* Left: image */}
              <div className="buy-card-left">
                <div className="buy-thumb">
                  {h.image ? (
                    <button
                      type="button"
                      className="thumb-click"
                      onClick={() =>
                        openLightbox(
                          `${process.env.REACT_APP_BACKEND_URL}${h.image}`
                        )
                      }
                      aria-label="View full image"
                    >
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}${h.image}`}
                        alt=""
                      />
                    </button>
                  ) : (
                    <div className="no-img">No Image</div>
                  )}
                  <span className="badge">Resale</span>
                </div>
              </div>

              {/* Middle: meta */}
              <div className="buy-card-mid">
                <div className="buy-title">
                  {(h.property_type || "Property")} in{" "}
                  {h.city || h.location || ""}
                </div>

                <div className="buy-meta">
                  <div className="price">
                    {formatCurrencyINR(actualPriceNum)}
                  </div>
                  <div className="meta-item">
                    {areaNum.toLocaleString()} sq.ft
                  </div>
                  <div className="meta-item">{bedsNum} Beds</div>
                  <div className="meta-item">{bathsNum} Baths</div>
                </div>

                {(h.location || h.city) && (
                  <div className="location-row">
                    <span className="pin">📍</span>
                    <span className="loc-text">{h.location || h.city}</span>
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div className="buy-card-right">
                <div className="btn-row">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      setRevealed((r) => ({ ...r, [k]: !isRevealed }))
                    }
                  >
                    {isRevealed ? h.contact || "NA" : "Contact"}
                  </button>

                  <button
                    className="btn details"
                    onClick={() => goDetails(h)}
                    title="View full details"
                  >
                    Go Details
                  </button>

                  {/* NEW: Go Live button */}
                  <button
                    className="btn go-live"
                    onClick={() => handleGoLive(h)}
                    title="Open this location in Google Maps"
                  >
                    Go Live
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

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
