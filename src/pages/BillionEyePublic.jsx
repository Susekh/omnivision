import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../src/public/assets/css/BillionEyePublic.css";
import { CameraAltRounded } from "@mui/icons-material";
import { User } from "lucide-react";
import api from "../api";
import Loader from "../components/loader";

const BillionEyePublic = () => {
  const navigate = useNavigate();
  const [statusIndex, setStatusIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const statusMessages = [
    "System Online - Monitoring Active",
    "AI Surveillance Running",
    "All Cameras Operational",
    "Real-time Incident Detection",
    "Network Status: Connected"
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("backend/user/check-auth");
        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate("/login");
        return;
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Cycle through status messages every 3 seconds
    const messageTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(messageTimer);
  }, [statusMessages.length]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="billionpublic-container">
      {/* Dotted Floating Background */}
      <div className="dotted-bg"></div>
      <div className="dotted-bg depth"></div>

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
        </div>

        {/* Action Button */}
        <div className="billionpublic-action-section">
          <button
            className="billionpublic-camera-btn"
            onClick={() => navigate("/Camera")}
          >
            <CameraAltRounded className="billionpublic-btn-icon" />
            <span>Incident & Report</span>
          </button>

          <button
            className="billionpublic-login-btn"
            onClick={() => navigate("/login")}
          >
            <User className="billionpublic-btn-icon" />
            <span>Switch Account</span>
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
