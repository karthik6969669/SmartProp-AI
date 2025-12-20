import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HousePredictionForm from "./components/prediction/HousePredictionForm";
import LandPredictionForm from "./components/prediction/LandPredictionForm";
import HomePage from "./components/home/HomePage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import VerifyEmail from "./components/auth/VerifyEmail";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import SellHouseForm from './components/sell/SellHouseForm';
import BuyHouseList from "./components/buy/BuyHouseList";
import SellLandForm from "./components/sell/SellLandForm";
import BuyLandList from "./components/buy/BuyLandList";
import PredictionsHub from "./pages/PredictionsHub";
import MarketInsights from "./pages/MarketInsights";
import AboutPage from "./pages/AboutPage";
import LandDetail from "./components/buy/LandDetail";
import HouseDetail from "./components/buy/HouseDetail";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* New Pages */}
        <Route path="/predictions" element={<PredictionsHub />} />
        <Route path="/insights" element={<MarketInsights />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Sell & Buy Routes */}
        <Route path="/sell-house" element={<SellHouseForm />} />
        <Route path="/buy-house" element={<BuyHouseList />} />
        <Route path="/sell-land" element={<SellLandForm />} />
        <Route path="/buy-land" element={<BuyLandList />} />
        <Route path="/land/:id" element={<LandDetail />} />
        <Route path="/house/:id" element={<HouseDetail />} />
        {/* Protected Prediction Routes */}
        <Route
          path="/predict-house"
          element={
            <ProtectedRoute>
              <HousePredictionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/predict-land"
          element={
            <ProtectedRoute>
              <LandPredictionForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
