import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password }),
      });

      const data = await response.json();

      if (response.ok) setMessage("Password reset successful! You can login now.");
      else setMessage(data.message || "Reset failed.");
    } catch {
      setMessage("Server error.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        <input
          name="password"
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        {message && (
          <div className={`auth-message ${message.startsWith("Password reset successful") ? "success" : ""}`}>
            {message}
          </div>
        )}
        <div className="auth-switch">
          <a href="/login">Return to Login</a>
        </div>
      </form>
    </div>
  );
}
