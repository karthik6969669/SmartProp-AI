import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [message, setMessage] = useState("");

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(form => ({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.terms) {
      setMessage("Please agree to the terms.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const userData = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Registration successful! You can now login.");
        // Optional navigate to login page after successful registration
        // navigate("/login");
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
      console.error("Registration error:", error);
    }
  };

  const initials = (form.firstName[0] || "S") + (form.lastName[0] || "P");

  return (
    <div className="register-bg">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Back to SmartProp AI
      </button>
      <div className="register-card">
        <div className="register-avatar">{initials}</div>
        <h2 className="register-heading">Create Account</h2>
        <div className="register-sub">
          Join SmartProp AI and start predicting property prices
        </div>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-row">
            <div className="register-group">
              <label className="register-label">First Name</label>
              <div className="register-input-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="register-group">
              <label className="register-label">Last Name</label>
              <div className="register-input-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="register-group">
            <label className="register-label">Email Address</label>
            <div className="register-input-icon">
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
          <div className="register-group">
            <label className="register-label">Password</label>
            <div className="register-input-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="register-group">
            <label className="register-label">Confirm Password</label>
            <div className="register-input-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="register-checkbox-row">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              id="termsCheckbox"
            />
            <label htmlFor="termsCheckbox" className="register-checkbox-label">
              I agree to the <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>
            </label>
          </div>
          <button className="register-btn" type="submit">
            Create Account
          </button>
          {message && <div className="register-message">{message}</div>}
          <div className="register-signin">
            Already have an account? <a href="/login">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
}
