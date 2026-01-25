import React, { useState } from "react";
import "../public/assets/css/Login.css";
import { Link } from "react-router-dom";
import api from "../api";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
      };

      console.log("Sending login request with data:", payload);

      const response = await api.post("backend/user/login", payload);
      console.log("Login response:", response);

      if (response.status === 200) {
        setSuccess("Login successful!");
        localStorage.setItem("token", response.data.token);
        navigate("/bmcreport");
      } else {
        setError("Invalid email or password.");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setError("Login failed. Please try again.");
    }
  };

  const handleLogin = () => {
    console.log("Login button clicked");
  };

  const isMobile = window.innerWidth <= 768;

  const sectionStyle = {
    backgroundColor: "#b3d9ff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    position: "relative",
    overflow: "hidden",
  };

  const wrapperStyle = {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "15px" : "20px",
    backgroundColor: "transparent",
    position: "relative",
    zIndex: 1,
  };

  const logoStyle = {
    maxWidth: isMobile ? "150px" : "250px",
    marginBottom: isMobile ? "12px" : "15px",
  };

  const titleStyle = {
    fontSize: isMobile ? "22px" : "32px",
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: isMobile ? "18px" : "25px",
    letterSpacing: isMobile ? "1px" : "2px",
    fontFamily: "'Poppins Bold', sans-serif",
    textTransform: "none",
    margin: `0 0 ${isMobile ? "18px" : "25px"} 0`,
  };

  const formContainerStyle = {
    backgroundColor: "transparent",
    padding: "0",
    margin: "0",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  };

  const containerStyle = {
    padding: "0",
    maxWidth: isMobile ? "100%" : "500px",
    width: "100%",
  };

  const colStyle = {
    padding: isMobile ? "0 15px" : "0",
  };

  const formStyle = {
    margin: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const inputStyle = {
    marginBottom: "12px",
    width: "calc(100% - 48px)",
  };

  const buttonStyle = {
    backgroundColor: "#000",
    borderColor: "#000",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    textDecoration: "none",
    display: "block",
    margin: "20px auto 0",
    width: "calc(100% - 48px)",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  };

  const linkStyle = {
    textAlign: "center",
    margin: "15px 0 0 0",
  };

  const linkTextStyle = {
    color: "#333",
    fontSize: "12px",
  };

  const linkAnchorStyle = {
    color: "#0d6efd",
    textDecoration: "none",
    fontWeight: "600",
  };

  const footerStyle = {
    backgroundColor: "transparent",
    color: "#333",
    textAlign: "center",
    padding: isMobile ? "10px 15px" : "12px 20px",
    margin: 0,
    marginTop: "auto",
    width: "100%",
    fontSize: isMobile ? "11px" : "14px",
    position: "relative",
    zIndex: 1,
  };

  return (
    <section style={sectionStyle} className="login-page-container">
      <div style={wrapperStyle}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginBottom: isMobile ? "12px" : "15px" }}>
          <img
            src="/images/omnivision-logo.png"
            alt="Logo"
            style={logoStyle}
          />
        </div>

        <h1 style={titleStyle}>Welcome to OmniVision</h1>

        <section style={formContainerStyle}>
          <div style={containerStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
              <div style={colStyle}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={formStyle}>
                  <div style={inputStyle}>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email Id"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>
                  <div style={inputStyle}>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={buttonStyle}>
                    Login
                  </button>
                  <p style={linkStyle}>
                    <span style={linkTextStyle}>
                      Don't have an account?{" "}
                      <Link to="/register" style={linkAnchorStyle}>
                        Sign Up
                      </Link>
                    </span>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer style={footerStyle}>
        <p style={{ margin: 0 }}>© 2026 OmniVision. All rights reserved by Neuradyne.</p>
      </footer>
    </section>
  );
};

export default LoginPage;