import { useNavigate } from "react-router-dom";
import "./PredictionsHub.css";



export default function PredictionsHub() {
  const nav = useNavigate();
  return (
    <div className="page predictions-hub">
      <header className="hero">
        <h1>Predict Property Prices</h1>
        <p>Choose house or land and get an instant AI-powered estimate.</p>
      </header>
      <div className="cards">
        <div className="card">
          <h3>🏠 House Price Prediction</h3>
          <p>Get accurate valuations for residential properties based on location, size, amenities, and market trends.</p>
          <button onClick={() => nav("/predict-house")} className="btn btn-primary">
            Predict House Price
          </button>
        </div>
        <div className="card">
          <h3>🌾 Land Price Prediction</h3>
          <p>Estimate land value for development, investment, or agricultural purposes with comprehensive analysis.</p>
          <button onClick={() => nav("/predict-land")} className="btn btn-success">
            Predict Land Price
          </button>
        </div>
      </div>
    </div>
  );
}
