import React from "react";
import { useNavigate } from "react-router-dom";
import "../../src/public/assets/css/BillionEyePublic.css";


// export default BillionEye;
const BillionEyePublic = () => {
  const navigate = useNavigate();
  
  return (
    <section
      className="bg-cover main home-page"
      style={{ backgroundImage: "url(/images/bg-1.png)" }}
    >
      {/* Header with OmniVision Name */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{backgroundColor: "rgba(0,0,0,0.3)", margin: 0, padding: "15px 0", width: "100%"}}>
        <div className="container-fluid" style={{padding: "0 20px"}}>
          <span className="navbar-brand fw-bold text-white" style={{fontSize: "24px"}}>
            OMNIVISION
          </span>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pag-1-wrapper" style={{paddingTop: "40px", paddingBottom: "40px"}}>
        <section className="pag-1-wrapper-sec-1">
          <figure>
            <img src="/images/pag-1-logo-bg.png" alt="Background Logo" />
          </figure>
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <figure className="logo-con">
                  
                    <img src="/images/omnivision-logo.png" alt="Logo" />
                 
                </figure>
              </div>
            </div>
          </div>
        </section>
        
        {/* Emergency Support Section */}
        <section className="emergency-section text-center" 
        style={{position:"relative", zIndex:1}}>
       
          <button className="btn btn-danger"
           onClick={() => navigate('/Camera')}
          >
            <i className="bi bi-camera-fill"></i> Incident & Report
          </button>
       
        </section>
          
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", textAlign: "center", padding: "15px 0", margin: 0, width: "100%"}}>
        <p style={{margin: 0, fontSize: "14px"}}>© 2025 OmniVision. All rights reserved.</p>
      </footer>
    </section>
  );
};

export default BillionEyePublic;
