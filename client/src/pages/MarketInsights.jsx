import React, { useEffect, useState } from "react";
import "./MarketInsights.css";

export default function MarketInsights() {
  const [houses, setHouses] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [h, l] = await Promise.all([
          fetch(`${process.env.REACT_APP_BACKEND_URL}/buy/houses`).then(r => r.json()),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/buy/lands`).then(r => r.json())
        ]);
        setHouses(Array.isArray(h) ? h : []);
        setLands(Array.isArray(l) ? l : []);
      } catch (e) {
        setErr("Failed to load market data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function avg(arr) {
    const vals = arr.map(x => Number(x.actualPrice)).filter(v => !isNaN(v) && v > 0);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }

  const houseAvg = avg(houses);
  const landAvg = avg(lands);

  return (
    <div className="page market-insights">
      <h2>📊 Market Insights</h2>
      {loading ? <div className="loading">Loading data...</div> : err ? <div className="error">{err}</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Avg House Price</h3>
              <p className="stat-value">{houseAvg ? `₹${houseAvg.toLocaleString("en-IN")}` : "N/A"}</p>
            </div>
            <div className="stat-card">
              <h3>Avg Land Price</h3>
              <p className="stat-value">{landAvg ? `₹${landAvg.toLocaleString("en-IN")}` : "N/A"}</p>
            </div>
            <div className="stat-card">
              <h3>House Listings</h3>
              <p className="stat-value">{houses.length}</p>
            </div>
            <div className="stat-card">
              <h3>Land Listings</h3>
              <p className="stat-value">{lands.length}</p>
            </div>
          </div>

          <h3>Recent Locations</h3>
          <ul className="location-list">
            {houses.slice(0,5).map(h => (
              <li key={`h-${h.id}`}>🏠 House • {h.city || h.location || "Unknown location"}</li>
            ))}
            {lands.slice(0,5).map(l => (
              <li key={`l-${l.id}`}>🌾 Land • {l.city || l.location || "Unknown location"}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
