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
        backgroundImage: "url(/images/bg-1.png)",
        backgroundColor: "#b3d9ff"
      }}
    >
      {/* Header with OmniVision Name */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{backgroundColor: "rgba(0,0,0,0.3)", margin: 0, padding: "15px 20px", width: "100%"}}>
        <div className="container-fluid" style={{padding: "0", display: "flex", alignItems: "center"}}>
          <span className="navbar-brand fw-bold text-white" style={{fontSize: "24px", margin: 0}}>
            OMNIVISION
          </span>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pag-1-wrapper" style={{paddingTop: "40px", paddingBottom: "40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
        <section className="pag-1-wrapper-sec-1" style={{width: "100%"}}>
          <figure style={{width: "100%", maxWidth: "400px", margin: "0 auto 20px"}}>
            <img src="/images/pag-1-logo-bg.png" alt="Background Logo" style={{width: "100%", height: "auto"}} />
          </figure>
          <div className="container" style={{width: "100%", padding: "0 20px"}}>
            <div className="row">
              <div className="col-md-12" style={{display: "flex", justifyContent: "center"}}>
                <figure className="logo-con">
                    <img src="/images/omnivision-logo.png" alt="Logo" style={{width: "100%", height: "auto"}} />
                </figure>
              </div>
            </div>
          </div>
        </section>
        
        {/* Emergency Support Section */}
        <section className="emergency-section text-center" 
        style={{position:"relative", zIndex:1, width: "100%", padding: "30px 20px"}}>
          <button className="btn btn-danger"
           onClick={() => navigate('/Camera')}
           style={{padding: "15px 30px", fontSize: "16px", fontWeight: "600", minWidth: "220px"}}
          >
            <CameraAltRounded/> Incident & Report
          </button>
        </section>
          
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", textAlign: "center", padding: "15px 20px", margin: 0, width: "100%", fontSize: "14px"}}>
        <p style={{margin: 0}}>© 2025 OmniVision. All rights reserved.</p>
      </footer>
    </section>
  );
};

export default BillionEyePublic;
