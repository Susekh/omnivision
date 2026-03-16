import React, { useState } from "react";
import api from "../api";
import "../public/assets/css/groundstaffLogin.css";
import { useNavigate } from "react-router-dom";

const GroundStaffLogin = () => {
  const [formData, setFormData] = useState({
    mobileNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Check if blocked
    const blockedUntil = localStorage.getItem("groundstaffLoginBlockedUntil");
    if (blockedUntil && new Date() < new Date(blockedUntil)) {
      setErrorMessage(
        "Too many failed attempts. Login is blocked for 24 hours.",
      );
      return;
    }

    if (!formData.mobileNumber) {
      setErrorMessage("Mobile number is required.");
      return;
    }
    if (!formData.password) {
      setErrorMessage("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("backend/groundstaff/login", {
        mobileNumber: formData.mobileNumber.trim(),
        password: formData.password,
      });

      if (response.status === 200) {
        // Reset attempts on success
        localStorage.removeItem("groundstaffLoginAttempts");
        localStorage.removeItem("groundstaffLoginBlockedUntil");
        const { groundStaff } = response.data;
        console.log("ground staff :", groundStaff);

        // Store groundstaff data for dashboard use
        localStorage.setItem("groundstaffData", JSON.stringify(groundStaff));

        const agencyId = groundStaff?.agencyId;

        setSuccessMessage("Login Successful!");

        setTimeout(() => {
          if (agencyId) {
            navigate(`/groundstaffdashboard/${agencyId}`);
          } else {
            setErrorMessage("Agency ID is missing. Please contact support.");
          }
        }, 1000);
      } else {
        throw new Error(
          response.data?.message || "Login Failed: Unknown error",
        );
      }
    } catch (error) {
      // Track failed attempts
      let attempts =
        parseInt(localStorage.getItem("groundstaffLoginAttempts") || "0", 10) +
        1;
      localStorage.setItem("groundstaffLoginAttempts", attempts);

      if (attempts === 3) {
        setErrorMessage(
          "Warning: Last 2 chances left before account is blocked for 24 hours.",
        );
      } else if (attempts === 4) {
        setErrorMessage(
          "Warning: Last chance left before account is blocked for 24 hours.",
        );
      } else if (attempts >= 5) {
        const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        localStorage.setItem("groundstaffLoginBlockedUntil", blockUntil);
        setErrorMessage(
          "Too many failed attempts. Login is blocked for 24 hours.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message || "Invalid credentials!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="main dashboard-hospital"
      style={{
        backgroundColor: "#b3d9ff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <div
        className="pag-1-wrapper"
        style={{
          backgroundColor: "#b3d9ff",
          paddingTop: window.innerWidth <= 768 ? "15px" : "20px",
          paddingBottom: window.innerWidth <= 768 ? "15px" : "20px",
          paddingLeft: window.innerWidth <= 768 ? "15px" : "0px",
          paddingRight: window.innerWidth <= 768 ? "15px" : "0px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          width: "100%",
        }}
      >
        {/* Logo Section - Centered in middle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: window.innerWidth <= 768 ? "12px" : "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src="/images/omnivision-logo.png"
              alt="Logo"
              style={{
                maxWidth: window.innerWidth <= 768 ? "150px" : "250px",
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        </div>

        {/* Welcome Title */}
        <h1
          style={{
            color: "#000000",
            fontFamily: "'Poppins Bold', sans-serif",
            textTransform: "none",
            fontWeight: 700,
            fontSize: window.innerWidth <= 768 ? "22px" : "32px",
            letterSpacing: window.innerWidth <= 768 ? "1px" : "2px",
            margin: `0 0 ${window.innerWidth <= 768 ? "18px" : "25px"} 0`,
            textAlign: "center",
          }}
        >
          Welcome to OmniVision - Ground Staff
        </h1>

        {/* Login Form Section */}
        <section
          className="sign-up-form dashboard-hospital-sign-up"
          style={{
            backgroundColor: "#b3d9ff",
            padding: "0",
            margin: "0",
            width: "100%",
          }}
        >
          <div
            className="container"
            style={{
              padding: "0",
              maxWidth: window.innerWidth <= 768 ? "100%" : "500px",
            }}
          >
            <div className="row">
              <div
                className="col-md-12"
                style={{ padding: window.innerWidth <= 768 ? "0 15px" : "0" }}
              >
                {/* Show error or success messages */}
                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}
                <form
                  onSubmit={handleSubmit}
                  style={{
                    margin: "0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="mb-3"
                    style={{ marginBottom: "12px", width: "calc(100% - 48px)" }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="MOBILE NUMBER"
                      name="mobileNumber"
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, ""); // Remove non-digits
                        if (onlyDigits.length <= 10) {
                          handleChange({
                            target: {
                              name: "mobileNumber",
                              value: onlyDigits,
                            },
                          });
                        }
                      }}
                      value={formData.mobileNumber}
                      autoComplete="off"
                      maxLength={10}
                      minLength={10}
                      required
                      pattern="\d{10}"
                      title="Please enter a valid 10-digit mobile number"
                      style={{
                        color: "black",
                        fontSize: "14px",
                        width: "100%",
                      }}
                    />
                  </div>

                  <div
                    className="mb-3"
                    style={{ marginBottom: "12px", width: "calc(100% - 48px)" }}
                  >
                    <input
                      type="password"
                      className="form-control"
                      placeholder="PASSWORD"
                      name="password"
                      onChange={handleChange}
                      value={formData.password}
                      style={{
                        color: "black",
                        fontSize: "14px",
                        width: "100%",
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
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
                    }}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  <p
                    className="mt-3"
                    style={{ textAlign: "center", margin: "15px 0 0 0" }}
                  >
                    {/* Contact your agency for credentials */}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#b3d9ff",
          color: "#333",
          textAlign: "center",
          padding: window.innerWidth <= 768 ? "10px 15px" : "12px 20px",
          margin: 0,
          marginTop: "auto",
          width: "100%",
          fontSize: window.innerWidth <= 768 ? "11px" : "14px",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 OmniVision. All rights reserved by Neuradyne.
        </p>
      </footer>
    </section>
  );
};

export default GroundStaffLogin;
