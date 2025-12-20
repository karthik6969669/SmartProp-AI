import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./LandDetail.css"; // reuse styling

function formatCurrencyINR(n) {
  if (n == null || isNaN(n)) return "₹0.00";
  const v = Number(n);
  if (v <= 0) return "₹0.00";
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function HouseDetail() {
  const { id } = useParams();
  const [house, setHouse] = useState(null);
  const [err, setErr] = useState("");
  const [lightSrc, setLightSrc] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id || String(id).length < 6) throw new Error("Missing or invalid id");
        const base = process.env.REACT_APP_BACKEND_URL;

        // Flask exposes GET /buy/house/<hid>
        const url = `${base}/buy/house/${id}`;

        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("House detail fetch error:", res.status, txt);
          throw new Error(`HTTP ${res.status}`);
        }
        const raw = await res.json();
        const data = raw?.data || raw;
        if (!data || typeof data !== "object") throw new Error("Invalid payload");
        setHouse(data);
      } catch (e) {
        setErr("Unable to load house details.");
      }
    };
    load();
  }, [id]);

  const openLight = (src) => setLightSrc(src);
  const closeLight = () => setLightSrc("");

  if (err) return <div className="buy-error">{err}</div>;
  if (!house) return <div className="buy-loading">Loading details...</div>;

  const imgList = Array.isArray(house.images) ? house.images : [];
  const cover = imgList.length ? `${process.env.REACT_APP_BACKEND_URL}${imgList[0]}` : "";
  const areaSqft = Number(house.area_sqft || 0);

  return (
    <div className="land-detail-page">
      <Link to="/buy-house" className="land-detail-back">← Back to list</Link>

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
            <span className="land-detail-badge">House</span>
          </div>

          {/* Content */}
          <div>
            <div className="land-detail-title">
              {(house.bedrooms ? `${house.bedrooms} BHK` : "House")} in {house.city || house.district || house.state || house.location || ""}
            </div>

            <div className="land-detail-price-line">
              <div className="land-detail-price">{formatCurrencyINR(house.actualPrice)}</div>
              <div className="land-detail-area">
                {areaSqft > 0 ? `${areaSqft.toLocaleString()} sq.ft` : "—"}
              </div>
            </div>

            <div className="land-detail-facts">
              <div className="land-detail-fact">
                <b>Location:</b><span className="value">{house.location || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>State:</b><span className="value">{house.state || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>District:</b><span className="value">{house.district || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>City:</b><span className="value">{house.city || "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Bedrooms:</b><span className="value">{house.bedrooms ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Bathrooms:</b><span className="value">{house.bathrooms ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Plot area:</b><span className="value">{house.plot_sqft ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Floors:</b><span className="value">{house.floors ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Age:</b><span className="value">{house.age_years ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Latitude:</b><span className="value">{house.latitude ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Longitude:</b><span className="value">{house.longitude ?? "-"}</span>
              </div>
              <div className="land-detail-fact">
                <b>Contact:</b><span className="value">{house.contact || "-"}</span>
              </div>
            </div>

            <div className="land-detail-actions">
              <a
                className="land-detail-call"
                href={house.contact ? `tel:${house.contact}` : undefined}
                onClick={(e) => !house.contact && e.preventDefault()}
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
