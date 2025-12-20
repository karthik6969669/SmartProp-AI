import React, { useState } from "react";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset email sent! Check your inbox.");
      } else {
        setMessage(data.message || "Request failed.");
      }
    } catch (error) {
      setMessage("Server error. Please try again later.");
      console.error("Forgot password error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <input
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && (
          <div
            className={`auth-message ${
              message.toLowerCase().includes("sent") ? "success" : ""
            }`}
          >
            {message}
          </div>
        )}
        <div className="auth-switch">
          Remember your password? <a href="/login">Login</a>
        </div>
      </form>
    </div>
  );
}
