import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const initials = "SP"; // Placeholder initials

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(form => ({
      ...form,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(""); // Clear previous messages on submit

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Login successful!");
        // Save JWT token from backend to localStorage for auth
        localStorage.setItem("authToken", data.token);

        // Redirect to home page after successful login
        navigate("/");
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-bg">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Back to SmartProp AI
      </button>
      <div className="login-card">
        <div className="login-avatar">{initials}</div>
        <h2 className="login-heading">Welcome Back</h2>
        <div className="login-sub">
          Sign in to your SmartProp AI account to continue
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-group">
            <label className="login-label">Email Address</label>
            <div className="login-input-icon">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="login-group">
            <label className="login-label">Password</label>
            <div className="login-input-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="login-row">
            <div />
            <button
              type="button"
              className="forgot-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot your password?
            </button>
          </div>
          <button className="login-btn" type="submit">
            Sign In
          </button>
          {message && <div className="login-message">{message}</div>}
          <div className="or-text">OR</div>
          <div className="login-signup">
            Don't have an account?{" "}
            <button
              className="signup-link-btn"
              type="button"
              onClick={() => navigate("/register")}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
