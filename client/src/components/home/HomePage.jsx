import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const initials = "SP";
  const [searchCity, setSearchCity] = useState("");
  const [propertyType, setPropertyType] = useState("all");

  const handleSearch = () => {
    if (!searchCity.trim()) {
      alert("Please enter a city name");
      return;
    }
    // Navigate to buy-house with city filter
    navigate(`/buy-house?city=${encodeURIComponent(searchCity.trim())}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      {/* Top Nav Bar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <div className="navbar-avatar">{initials}</div>
            <span className="navbar-title">SmartProp AI</span>
          </div>
        </div>
        <div className="navbar-right">
          <Link to="/predictions" className="navbar-link">Predictions</Link>
          <Link to="/insights" className="navbar-link">Market Insights</Link>
          <Link to="/about" className="navbar-link">About</Link>
          <button className="navbar-login-btn" onClick={() => navigate("/login")}>
            <span className="navbar-user-icon" role="img" aria-label="User">👤</span>{" "}
            Login
          </button>
          <button className="navbar-signup-btn" onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="homepage-bg">
        <h1 className="headline">
          Predict Property Prices
          <br />
          with <span className="highlight">AI Intelligence</span>
        </h1>
        <p className="subtext">
          Get accurate house and land price predictions powered by advanced algorithms and real-time market data.
          <br />
          Make informed investment decisions today.
        </p>
        <div className="stats-row">
          <div>
            <span className="stats-number">50K+</span>
            <span className="stats-label">Properties Analyzed</span>
          </div>
          <div>
            <span className="stats-number">95%</span>
            <span className="stats-label">Accuracy Rate</span>
          </div>
          <div>
            <span className="stats-number">24/7</span>
            <span className="stats-label">Real-Time Updates</span>
          </div>
        </div>
      </div>

      <h2 className="choose-header">Choose Your Prediction Type</h2>
      <div className="predict-cards-row">
        <div className="predict-card">
          <div className="card-image-wrapper">
            <img src="/icons/housepredict.png" alt="House Price Prediction" className="card-image" />
            <div className="card-badge home-badge">
              <img src="/icons/home-button.png" alt="House Icon" />
            </div>
          </div>
          <h3>House Price Prediction</h3>
          <p>
            Get accurate valuations for residential properties based on location, size, amenities, and market trends
          </p>
          <div className="card-features">
            <span>🏛 Advanced Algorithm</span>
            <span>📍 Location Analysis</span>
          </div>
          <button className="predict-card-btn" onClick={() => navigate("/predict-house")}>
            Predict House Price
          </button>
        </div>
        <div className="predict-card">
          <div className="card-image-wrapper">
            <img src="/icons/landpredict.png" alt="Land Price Prediction" className="card-image" />
            <div className="card-badge land-badge">
              <img src="/icons/location-pin.png" alt="Land Icon" />
            </div>
          </div>
          <h3>Land Price Prediction</h3>
          <p>
            Evaluate land values for development, investment, or agricultural purposes with comprehensive analysis
          </p>
          <div className="card-features">
            <span>📈 Market Analysis</span>
            <span>📌 Zone Classification</span>
          </div>
          <button className="predict-card-btn land" onClick={() => navigate("/predict-land")}>
            Predict Land Price
          </button>
        </div>
      </div>

      {/* Professional Search Bar - Separate Boxes */}
      <div className="search-section-modern">
        <h2>🔍 Find Properties by City</h2>
        <div className="search-bar-container">
          {/* Property Type Dropdown */}
          <select 
            className="property-type-dropdown"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="all">Houses</option>
            <option value="apartment">Apartments</option>
            <option value="villa">Villas</option>
            <option value="land">Plots/Land</option>
          </select>

          {/* Separate Search Input Box */}
          <input
            type="text"
            placeholder="Enter city name (e.g., Chennai, Mumbai, Bangalore...)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input-box"
          />

          {/* Location Icon Button */}
          <button className="location-icon-btn" title="Use my location">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </button>

          {/* Search Button */}
          <button onClick={handleSearch} className="search-action-btn">
            Search
          </button>
        </div>
        <p className="search-hint">Search by city to find available houses and lands</p>
      </div>

      {/* Always Visible Buy/Sell Cards */}
      <h2 className="actions-header">Buy & Sell Properties</h2>
      <div className="action-cards-grid">
        <div className="action-card">
          <div className="action-thumb">
            <img src="/icons/house1.png" alt="Sell House" />
            <span className="action-badge sell">Sell</span>
          </div>
          <div className="action-body">
            <h3>Sell House</h3>
            <p>List your home with price, photos, and exact location.</p>
            <button className="action-cta purple" onClick={() => navigate("/sell-house")}>
              Sell House
            </button>
          </div>
        </div>

        <div className="action-card">
          <div className="action-thumb">
            <img src="/icons/house2.png" alt="Buy House" />
            <span className="action-badge buy">Buy</span>
          </div>
          <div className="action-body">
            <h3>Buy House</h3>
            <p>Browse verified homes and contact owners directly.</p>
            <button className="action-cta green" onClick={() => navigate("/buy-house")}>
              Buy House
            </button>
          </div>
        </div>

        <div className="action-card">
          <div className="action-thumb">
            <img src="/icons/Land1.png" alt="Sell Land" />
            <span className="action-badge sell">Sell</span>
          </div>
          <div className="action-body">
            <h3>Sell Land</h3>
            <p>Post plots with coordinates, size, and clear images.</p>
            <button className="action-cta orange" onClick={() => navigate("/sell-land")}>
              Sell Land
            </button>
          </div>
        </div>

        <div className="action-card">
          <div className="action-thumb">
            <img src="/icons/Land2.png" alt="Buy Land" />
            <span className="action-badge buy">Buy</span>
          </div>
          <div className="action-body">
            <h3>Buy Land</h3>
            <p>Find plots in preferred localities with insights.</p>
            <button className="action-cta blue" onClick={() => navigate("/buy-land")}>
              Buy Land
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
