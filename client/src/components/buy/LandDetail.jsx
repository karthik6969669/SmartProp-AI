import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./LandDetail.css"; // keep this import after any global CSS

function formatCurrencyINR(n) {
  if (n == null || isNaN(n)) return "₹0.00";
  const v = Number(n);
  if (v <= 0) return "₹0.00";
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function LandDetail() {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const [err, setErr] = useState("");
  const [lightSrc, setLightSrc] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/land/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLand(data);
      } catch (e) {
        setErr("Unable to load land details.");
      }
    };
    load();
  }, [id]);

  const openLight = (src) => setLightSrc(src);
  const closeLight = () => setLightSrc("");

  if (err) return <div className="buy-error">{err}</div>;
  if (!land) return <div className="buy-loading">Loading details...</div>;

  const imgList = Array.isArray(land.images) ? land.images : [];
  const cover = imgList.length ? `${process.env.REACT_APP_BACKEND_URL}${imgList[0]}` : "";

  const areaSqft = Number(land.area_sqft || 0);

  return (
    <div className="land-detail-page">
      <Link to="/buy-land" className="land-detail-back">← Back to list</Link>

      <div className="land-detail-card">
        <div className="land-detail-row">
          {/* Media */}
          <div className="land-detail-media">
            {cover ? (
              <img
                className="land-detail-thumb"
                src={cover}
                alt=""
                onClick={() => openLight(cover)}
              />
            ) : null}
            <span className="land-detail-badge">Land</span>
          </div>

          {/* Content */}
          <div>
            <div className="land-detail-title">
              {land.zoning || "Land"} in {land.city || land.district || land.state || land.location || ""}
            </div>

            <div className="land-detail-price-line">
              <div className="land-detail-price">{formatCurrencyINR(land.actualPrice)}</div>
              <div className="land-detail-area">
                {areaSqft > 0 ? `${areaSqft.toLocaleString()} sq.ft` : "—"}
              </div>
            </div>

            <div className="land-detail-facts">
              <div className="land-detail-fact">
                <b>Location:</b><span className="value">{land.location || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>State:</b><span className="value">{land.state || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>District:</b><span className="value">{land.district || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>City:</b><span className="value">{land.city || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Latitude:</b><span className="value">{land.latitude ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Longitude:</b><span className="value">{land.longitude ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Contact:</b><span className="value">{land.contact || "-"}</span>
              </div>
            </div>

            <div className="land-detail-actions">
              <a
                className="land-detail-call"
                href={land.contact ? `tel:${land.contact}` : undefined}
                onClick={(e) => !land.contact && e.preventDefault()}
              >
                Whatsapp
              </a>
            </div>
          </div>
        </div>

        {imgList.length > 1 && (
          <div className="land-detail-gallery">
            {imgList.slice(1).map((src) => {
              const full = `${process.env.REACT_APP_BACKEND_URL}${src}`;
              return (
                <img key={src} src={full} alt="" onClick={() => openLight(full)} />
              );
            })}
          </div>
        )}
      </div>

      <div className={`ld-lightbox ${lightSrc ? "open" : ""}`} onClick={closeLight}>
        {lightSrc && (
          <>
            <button className="ld-lightbox-close" onClick={closeLight}>Close</button>
            <img src={lightSrc} alt="" />
          </>
        )}
      </div>
    </div>
  );
}
