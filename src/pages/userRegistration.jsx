import React, { useState } from "react";
import "../public/assets/css/Register.css";
import { Link } from "react-router-dom";

import api from "../api";

const handleLogin = () => {
  console.log("Login button clicked");
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isMobile = window.innerWidth <= 768;

  const sectionStyle = {
    backgroundColor: "#b3d9ff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  };

  const wrapperStyle = {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "15px" : "20px",
    backgroundColor: "#b3d9ff",
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
    backgroundColor: "#b3d9ff",
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
    backgroundColor: "#b3d9ff",
    color: "#333",
    textAlign: "center",
    padding: isMobile ? "10px 15px" : "12px 20px",
    margin: 0,
    marginTop: "auto",
    width: "100%",
    fontSize: isMobile ? "11px" : "14px",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        fullname: {
          firstname: formData.firstName,
          lastname: formData.lastName,
        },
        email: formData.email,
        password: formData.password,
      };

      console.log("Sending request with data:", payload);

      const response = await api.post("backend/user/register", payload);
      console.log("Response:", response);

      console.log("Success response:", response.data);
      setSuccess("Registration successful!");
    } catch (error) {
      window.alert(error);
      console.error("Error:", error.response?.data || error.message);
      setError(
        error.response.data?.message || "Failed to register. Please try again."
      );
    }
  };

  return (
    <section style={sectionStyle}>
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
                      id="firstName"
                      type="text"
                      className="form-control"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>
                  <div style={inputStyle}>
                    <input
                      id="lastName"
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>
                  <div style={inputStyle}>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>
                  <div style={inputStyle}>
                    <input
                      id="password"
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={buttonStyle}>
                    Register
                  </button>
                  <p style={linkStyle}>
                    <span style={linkTextStyle}>
                      Have an account already?{" "}
                      <Link to="/login" style={linkAnchorStyle}>
                        Log In
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
        <p style={{ margin: 0 }}>© 2025 OmniVision. All rights reserved.</p>
      </footer>
    </section>
  );
};

export default RegisterPage;
