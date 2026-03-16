import React, { useState } from "react";
import api from "../api";
import "../public/assets/css/AdminAuth.css";

const AdminAuth = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.fullname.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!formData.password) {
      setErrorMessage("Password is required.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/backend/admin/register", {
        fullname: formData.fullname.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Registration successful! You can now login.");
        setFormData({
          fullname: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setActiveTab("login");
      } else {
        throw new Error(response.data?.message || "Registration failed");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }
    if (!formData.password) {
      setErrorMessage("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/backend/admin/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.status === 200) {
        setSuccessMessage("Login successful!");
        setTimeout(() => {
          onLogin();
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Login failed");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-root">
        <div className="auth-pattern" />

        <div className="auth-card">
          <div className="auth-header">
            <img
              src="/images/omnivision-logo.png"
              alt="OmniVision Logo"
              className="auth-logo"
              onError={(e) => (e.target.style.display = "none")}
            />
            <h2 className="auth-title">Admin Portal</h2>
          </div>

          {/* <div className="auth-tabs">
            <button
              onClick={() => setActiveTab("register")}
              className={`auth-tab${activeTab === "register" ? " auth-tab--active" : ""}`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`auth-tab${activeTab === "login" ? " auth-tab--active" : ""}`}
            >
              Login
            </button>
          </div> */}

          {errorMessage && (
            <div className="auth-alert auth-alert--error">
              <svg className="auth-alert-icon" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#be123c" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 11h.01" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="auth-alert auth-alert--success">
              <svg className="auth-alert-icon" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#15803d" strokeWidth="1.5"/>
                <path d="M5 8.5l2 2 4-4" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {successMessage}
            </div>
          )}

          {activeTab === "register" && (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="auth-btn">
                {loading && <span className="auth-btn-spinner" />}
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          {activeTab === "login" && (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="auth-btn">
                {loading && <span className="auth-btn-spinner" />}
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAuth;