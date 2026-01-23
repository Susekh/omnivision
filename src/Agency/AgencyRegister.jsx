import { useState, useEffect } from "react";
import "../public/assets/css/AgencyRegister.css";
import { Link } from "react-router-dom";
import api from "../api";

const AgencyRegister = () => {
  const [formData, setFormData] = useState({
    agencyName: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    lat: null, // Automatically fetched latitude
    lng: null, // Automatically fetched longitude
  });

  const [locationError, setLocationError] = useState(null);

  // Fetch user's location using Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prevData) => ({
            ...prevData,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          console.log("Location fetched:", position.coords);
        },
        (error) => {
          console.error("Error fetching location:", error.message);
          setLocationError(
            "Unable to fetch location. Please allow location access."
          );
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    console.log(`Updated ${name}:`, value); // Debugging log
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.agencyName ||
      !formData.mobileNumber ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill all fields before submitting.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log("Submitting Form Data:", formData);

    try {
      const requestData = {
        AgencyName: formData.agencyName,
        mobileNumber: formData.mobileNumber,
        password: formData.password,
        lat: formData.lat,
        lng: formData.lng,
      };

      const response = await api.post("backend/agency", requestData);

      console.log("API Response:", response);

      if (response.status === 200 || response.status === 201) {
        alert("Agency Registered Successfully!");
      } else {
        alert(
          "Registration Failed: " + (response.data?.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error Registering Agency:", error);

      if (error.response) {
        console.error("Response Data:", error.response.data);
        console.error("Response Status:", error.response.status);
        console.error("Response Headers:", error.response.headers);
        alert(
          `Error: ${error.response.data?.message || "Something went wrong!"}`
        );
      } else if (error.request) {
        console.error("No Response Received:", error.request);
        alert("No response received from the server.");
      } else {
        console.error("Axios Error:", error.message);
        alert("Request failed: " + error.message);
      }
    }
  };

  return (
    <section className="main dashboard-hospital" style={{
      backgroundColor: "#b3d9ff", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      flex: 1
    }}>
      <div className="pag-1-wrapper" style={{
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
        width: "100%"
      }}>
        {/* Logo Section - Centered in middle */}
        <div style={{
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          width: "100%", 
          marginBottom: window.innerWidth <= 768 ? "12px" : "15px"
        }}>
          <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <img 
              src="/images/omnivision-logo.png" 
              alt="Logo" 
              style={{
                maxWidth: window.innerWidth <= 768 ? "150px" : "250px", 
                width: "100%", 
                height: "auto"
              }} 
            />
          </div>
        </div>

        {/* Welcome Title */}
        <h1 style={{
          color: "#000000",
          fontFamily: "'Poppins Bold', sans-serif",
          textTransform: "none",
          fontWeight: 700,
          fontSize: window.innerWidth <= 768 ? "22px" : "32px",
          letterSpacing: window.innerWidth <= 768 ? "1px" : "2px",
          margin: `0 0 ${window.innerWidth <= 768 ? "18px" : "25px"} 0`,
          textAlign: "center"
        }}>
          Welcome to OmniVision
        </h1>

        {/* Sign-Up Form Section */}
        <section
          className="sign-up-form dashboard-hospital-sign-up"
          style={{ 
            backgroundColor: "#b3d9ff",
            padding: "0",
            margin: "0"
          }}
        >
          <div className="container" style={{padding: "0", maxWidth: window.innerWidth <= 768 ? "100%" : "500px"}}>
            <div className="row">
              <div className="col-md-12" style={{padding: window.innerWidth <= 768 ? "0 15px" : "0"}}>
                <form onSubmit={handleSubmit} style={{margin: "0", display: "flex", flexDirection: "column", alignItems: "center"}}>
                  <div className="mb-3" style={{marginBottom: "12px", width: "calc(100% - 48px)"}}>
                    <input
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                      type="text"
                      className="form-control"
                      placeholder="AGENCY NAME"
                      name="agencyName"
                      onChange={handleChange}
                      value={formData.agencyName}
                      required
                    />
                  </div>
                  <div className="mb-3" style={{marginBottom: "12px", width: "calc(100% - 48px)"}}>
                    <input
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                      type="text"
                      className="form-control"
                      placeholder="MOBILE NUMBER"
                      name="mobileNumber"
                      autoComplete="off"
                      value={formData.mobileNumber}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '');
                        if (onlyDigits.length <= 10) {
                          handleChange({
                            target: {
                              name: 'mobileNumber',
                              value: onlyDigits,
                            },
                          });
                        }
                      }}
                      maxLength={10}
                      minLength={10}
                      pattern="\d{10}"
                      required
                      title="Please enter a valid 10-digit mobile number"
                    />
                  </div>

                  <div className="mb-3" style={{marginBottom: "12px", width: "calc(100% - 48px)"}}>
                    <input
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                      type="password"
                      className="form-control"
                      placeholder="PASSWORD"
                      name="password"
                      onChange={handleChange}
                      value={formData.password}
                      required
                    />
                  </div>
                  <div className="mb-3" style={{marginBottom: "12px", width: "calc(100% - 48px)"}}>
                    <input
                      style={{ color: "black", fontSize: "14px", width: "100%" }}
                      type="password"
                      className="form-control"
                      placeholder="CONFIRM PASSWORD"
                      name="confirmPassword"
                      onChange={handleChange}
                      value={formData.confirmPassword}
                      required
                    />
                  </div>
                  {locationError && (
                    <div className="alert alert-warning" role="alert">
                      {locationError}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ 
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
                    cursor: "pointer"
                  }}>
                    Register
                  </button>
                  <p className="mt-3" style={{textAlign: "center", margin: "15px 0 0 0"}}>
                    <span style={{color: "#333", fontSize: "12px"}}>
                      Have an account already?{" "}
                      <Link to="/agencyLogin" style={{color: "#0d6efd", textDecoration: "none", fontWeight: "600"}}>
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

      {/* Footer */}
      <footer style={{
        backgroundColor: "#b3d9ff", 
        color: "#333", 
        textAlign: "center", 
        padding: window.innerWidth <= 768 ? "10px 15px" : "12px 20px", 
        margin: 0, 
        marginTop: "auto", 
        width: "100%", 
        fontSize: window.innerWidth <= 768 ? "11px" : "14px"
      }}>
        <p style={{margin: 0}}>© 2025 OmniVision. All rights reserved.</p>
      </footer>
    </section>
  );
};

export default AgencyRegister;
