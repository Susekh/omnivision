import React from "react";
import { useNavigate } from "react-router-dom";
import "../../src/public/assets/css/BillionEyePublic.css";
import { CameraAltRounded } from "@mui/icons-material";


// export default BillionEye;
const BillionEyePublic = () => {
  const navigate = useNavigate();
  
  return (
    <section
      className="bg-cover main home-page"
      style={{ 
        backgroundColor: "#b3d9ff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Page Content */}
      <div className="pag-1-wrapper" style={{
        backgroundColor: "#b3d9ff",
        paddingTop: "40px", 
        paddingBottom: "40px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        minHeight: "80vh"
      }}>
        {/* Logo Section - Centered in middle */}
        <div className="logo-container" style={{
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center", 
          width: "100%", 
          marginBottom: "40px"
        }}>
          <div style={{
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <img 
              src="/images/omnivision-logo.png" 
              alt="Logo" 
              className="home-logo"
              style={{
                maxWidth: "300px", 
                width: "100%", 
                height: "auto"
              }} 
            />
          </div>
          {/* OMNIVISION Text Below Logo */}
          <h1 className="omnivision-title" style={{
            color: "#000000",
            fontFamily: "'Poppins Bold', sans-serif",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "2px",
            margin: 0,
            textAlign: "center"
          }}>
            Welcome to OmniVision
          </h1>
        </div>
        
        {/* Emergency Support Section */}
        <section className="emergency-section text-center" 
        style={{
          position: "relative", 
          zIndex: 1, 
          width: "100%", 
          padding: "30px 20px"
        }}>
          <button 
            className="btn btn-danger emergency-btn"
            onClick={() => navigate('/Camera')}
            style={{
              padding: "15px 30px", 
              fontSize: "16px", 
              fontWeight: "600", 
              minWidth: "220px",
              maxWidth: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <CameraAltRounded/> Incident & Report
          </button>
        </section>
          
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#b3d9ff", 
        color: "#333", 
        textAlign: "center", 
        padding: "15px 20px", 
        margin: 0, 
        width: "100%", 
        fontSize: "14px"
      }}>
        <p style={{margin: 0, color: "#333", fontSize: "14px", fontWeight: "400"}}>© 2026 OmniVision. All rights reserved by Neuradyne.</p>
      </footer>
    </section>
  );
};

export default BillionEyePublic;
