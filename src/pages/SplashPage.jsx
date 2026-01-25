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
      <div className="splash-wrapper">
        
        {/* AI Core & Branding */}
        <div className="splash-top-section">
          {/* AI Core with orbital rings */}
          <div className="ai-core">
            <img
              src="/images/omnivision-logo.png"
              alt="OmniVision Logo"
              className="ai-core-img"
            />
            
            {/* Orbital rings */}
            <div className="orbital-ring orbital-ring-1"></div>
            <div className="orbital-ring orbital-ring-2"></div>
            <div className="orbital-ring orbital-ring-3"></div>
            
            {/* Glowing dots on orbits */}
            {/* <div className="orbit-dot orbit-dot-1"></div>
            <div className="orbit-dot orbit-dot-2"></div> */}
          </div>

          {/* Brand name */}
          <div className="splash-brand">
            <h1 className="splash-title">OmniVision</h1>
            <p className="splash-subtitle">Smart Surveillance System</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="status-card">
          <div className="status-title">SYSTEM STATUS</div>
          <div className="status-message">Initializing AI Modules</div>
          
          {/* Loading dots */}
          <div className="splash-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
        </div>

        {/* Bottom CTA */}
        {/* <div className="splash-footer">
          <div className="swipe-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 25L12 17L14 15L20 21L26 15L28 17L20 25Z" fill="rgba(255,255,255,0.6)"/>
            </svg>
          </div>
          <p className="splash-footer-text">Swipe up to enter dashboard</p>
        </div> */}
        {/* Bottom accent */}
      <div className="splash-footer">
        <p className="splash-footer-text">Connecting Safety & Intelligence</p>
      </div>

      </div>
    </div>
  );
};

export default SplashPage;