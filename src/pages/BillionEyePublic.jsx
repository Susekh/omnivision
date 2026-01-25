import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../src/public/assets/css/BillionEyePublic.css";
import { CameraAltRounded } from "@mui/icons-material";

const BillionEyePublic = () => {
  const navigate = useNavigate();
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    "System Online & Monitoring",
    "AI Detection Active",
    "Secure Connection Established",
    "Ready for Surveillance"
  ];

  useEffect(() => {
    // Cycle through status messages every 3 seconds
    const messageTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(messageTimer);
  }, []);

  return (
    <section className="billionpublic-container">
      <div className="billionpublic-wrapper">
        
        {/* Top Section - Logo and Branding */}
        <div className="billionpublic-top-section">
          {/* AI Core with orbital rings */}
          <div className="billionpublic-ai-core">
            <img
              src="/images/omnivision-logo.png"
              alt="OmniVision Logo"
              className="billionpublic-logo-img"
            />
            
            {/* Orbital rings */}
            <div className="billionpublic-orbital-ring billionpublic-orbital-ring-1"></div>
            <div className="billionpublic-orbital-ring billionpublic-orbital-ring-2"></div>
            <div className="billionpublic-orbital-ring billionpublic-orbital-ring-3"></div>
            
            {/* Glowing dots on orbits */}
            {/* <div className="billionpublic-orbit-dot billionpublic-orbit-dot-1"></div>
            <div className="billionpublic-orbit-dot billionpublic-orbit-dot-2"></div> */}
          </div>

          {/* Brand name */}
          <div className="billionpublic-brand">
            <h1 className="billionpublic-title">OmniVision</h1>
            <p className="billionpublic-subtitle">Smart Surveillance System</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="billionpublic-status-card">
          <div className="billionpublic-status-title">SYSTEM STATUS</div>
          <div className="billionpublic-status-message">
            {statusMessages[statusIndex]}
          </div>
          
          {/* Loading dots */}
          <div className="billionpublic-loader">
            <div className="billionpublic-loader-dot"></div>
            <div className="billionpublic-loader-dot"></div>
            <div className="billionpublic-loader-dot"></div>
          </div>
        </div>

        {/* Action Button */}
        <div className="billionpublic-action-section">
          <button 
            className="billionpublic-camera-btn"
            onClick={() => navigate('/Camera')}
          >
            <CameraAltRounded className="billionpublic-btn-icon" />
            <span>Incident & Report</span>
          </button>
        </div>

        {/* Footer */}
        <div className="billionpublic-footer">
          <p className="billionpublic-footer-text">
            © 2026 OmniVision. All rights reserved by Neuradyne.
          </p>
        </div>

      </div>
    </section>
  );
};

export default BillionEyePublic;