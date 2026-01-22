import React, { useState } from "react";
import api from "../api";
import "../public/assets/css/AgencyLogin.css";
import { Link, useNavigate } from "react-router-dom";

const AgencyLogin = () => {
  // const { AgencyId } = useParams();
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
    const blockedUntil = localStorage.getItem("agencyLoginBlockedUntil");
    if (blockedUntil && new Date() < new Date(blockedUntil)) {
      setErrorMessage("Too many failed attempts. Login is blocked for 24 hours.");
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
      const response = await api.post("backend/agency/login", {
        mobileNumber: formData.mobileNumber.trim(),
        password: formData.password,
      });

      if (response.status === 200) {
        // Reset attempts on success
        localStorage.removeItem("agencyLoginAttempts");
        localStorage.removeItem("agencyLoginBlockedUntil");
        const { token, agency } = response.data;
        const agencyId = agency?.AgencyId;

        localStorage.setItem("token", token);
        setSuccessMessage("Login Successful!");

        setTimeout(() => {
          if (agencyId) {
            navigate(`/dashboard/${agencyId}`);
          } else {
            setErrorMessage("Agency ID is missing. Please contact support.");
          }
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Login Failed: Unknown error");
      }
    } catch (error) {
      // Track failed attempts
      let attempts = parseInt(localStorage.getItem("agencyLoginAttempts") || "0", 10) + 1;
      localStorage.setItem("agencyLoginAttempts", attempts);

      if (attempts === 3) {
        setErrorMessage("Warning: Last 2 chances left before account is blocked for 24 hours.");
      } else if (attempts === 4) {
        setErrorMessage("Warning: Last chance left before account is blocked for 24 hours.");
      } else if (attempts >= 5) {
        const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        localStorage.setItem("agencyLoginBlockedUntil", blockUntil);
        setErrorMessage("Too many failed attempts. Login is blocked for 24 hours.");
      } else {
        setErrorMessage(error.response?.data?.message || "Invalid credentials!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="main dashboard-hospital" style={{backgroundColor: "#b3d9ff", backgroundImage: "url(/images/bg-1.png)", backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundPosition: "center bottom"}}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{backgroundColor: "rgba(0,0,0,0.3)", margin: 0, padding: "15px 20px", width: "100%"}}>
        <div className="container-fluid" style={{padding: "0", display: "flex", alignItems: "center"}}>
          <span className="navbar-brand fw-bold text-white" style={{fontSize: "24px", margin: 0}}>
            OMNIVISION
          </span>
          <div className="ms-auto">
            <Link to={"/agencyRegister"}>
              <button
                className="btn btn-outline-light me-2"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", borderColor: "white", color: "white" }}
              >
                Register
              </button>
            </Link>
          </div>
        </div>
      </nav>
      <div className="pag-1-wrapper">
        {/* Background Images Section */}
        <section className="pag-1-wrapper-sec-1" style={{width: "100%"}}>
          <figure style={{width: "100%", maxWidth: "400px", margin: "0 auto 20px"}}>
            <img src="/images/pag-1-logo-bg.png" alt="Background Logo" style={{width: "100%", height: "auto"}} />
          </figure>
          <div className="container" style={{width: "100%", padding: "0 20px"}}>
            <div className="row">
              <div className="col-md-12" style={{display: "flex", justifyContent: "center"}}>
                <figure className="logo-con">
                  <Link>
                    <img src="/images/omnivision-logo.png" alt="Logo" style={{width: "100%", height: "auto"}} />
                  </Link>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* Login Form Section */}
        <section className="sign-up-form dashboard-hospital-sign-up">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
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
                <form onSubmit={handleSubmit} style={{ marginTop: "-150px" }}>
                  <div className="mb-3">
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
                      style={{ color: "black" }}
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="PASSWORD"
                      name="password"
                      onChange={handleChange}
                      value={formData.password}
                      style={{ color: "black" }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ textDecoration: "none", color: "#fff" }}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  {/* <p className="mt-3">
                    <span
                      style={{ cursor: "pointer", color: "#0d6efd" }}
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </span>
                  </p> */}
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", textAlign: "center", padding: "15px 20px", margin: 0, width: "100%", fontSize: "14px"}}>
        <p style={{margin: 0}}>© 2025 OmniVision. All rights reserved.</p>
      </footer>
    </section>
  );
};

export default AgencyLogin;
