import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../public/assets/css/SplashPage.css";

const SplashPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to /Camera after 3 seconds
    const timer = setTimeout(() => {
      navigate("/Camera", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      {/* Background gradient overlay */}
      <div className="splash-background">
        <div className="splash-gradient"></div>
      </div>

      {/* Main splash content */}
      <div className="splash-content">
        {/* Logo with animation */}
        <div className="splash-logo-wrapper">
          <img
            src="/images/omnivision-logo.png"
            alt="OmniVision Logo"
            className="splash-logo"
          />
        </div>

        {/* Brand name with animation */}
        <div className="splash-brand">
          <h1 className="splash-title">OmniVision</h1>
          <p className="splash-subtitle">Smart Surveillance System</p>
        </div>

        {/* Loading animation */}
        <div className="splash-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="splash-footer">
        <p className="splash-footer-text">Connecting Safety & Intelligence</p>
      </div>
    </div>
  );
};

export default SplashPage;
