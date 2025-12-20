import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [message, setMessage] = useState("Verifying...");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (!token) {
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setMessage("Verification failed or token expired.");
        }
      })
      .catch(() => setMessage("Network error. Please try again later."));
  }, [location.search, navigate]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.2rem",
        color: message.toLowerCase().includes("success") ? "green" : "red",
        padding: "20px",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
