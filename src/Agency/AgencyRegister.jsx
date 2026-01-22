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
    <section className="main dashboard-hospital" style={{backgroundColor: "#b3d9ff", backgroundImage: "url(/images/bg-1.png)", backgroundRepeat: "no-repeat", backgroundSize: "cover", backgroundPosition: "center bottom"}}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{backgroundColor: "rgba(0,0,0,0.3)", margin: 0, padding: "15px 20px", width: "100%"}}>
        <div className="container-fluid" style={{padding: "0", display: "flex", alignItems: "center"}}>
          <span className="navbar-brand fw-bold text-white" style={{fontSize: "24px", margin: 0}}>
            OMNIVISION
          </span>
          <div className="ms-auto">
            <Link to="/agencyLogin">
              <button
                className="btn btn-outline-light me-2"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", borderColor: "white", color: "white" }}
              >
                Login
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

        {/* Sign-Up Form Section */}
        <section
          className="sign-up-form dashboard-hospital-sign-up"
          style={{ marginTop: "-2px" }}
        >
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <form style={{ marginTop: "-150px" }} onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      style={{ color: "black" }}
                      type="text"
                      className="form-control"
                      placeholder="AGENCY NAME"
                      name="agencyName"
                      onChange={handleChange}
                      value={formData.agencyName} // Ensure this is tied to state
                      required
                    />
                  </div>
                  <div className="mb-3">
  <input
    style={{ color: "black" }}
    type="text"
    className="form-control"
    placeholder="MOBILE NUMBER"
    name="mobileNumber"
    autoComplete="off"
    value={formData.mobileNumber}
    onChange={(e) => {
      const onlyDigits = e.target.value.replace(/\D/g, ''); // Remove non-digits
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

                  <div className="mb-3">
                    <input
                      style={{ color: "black" }}
                      type="password"
                      className="form-control"
                      placeholder="PASSWORD"
                      name="password"
                      onChange={handleChange}
                      value={formData.password}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      style={{ color: "black" }}
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
                  <button type="submit" className="btn btn-primary">
                    Register
                  </button>
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

export default AgencyRegister;
