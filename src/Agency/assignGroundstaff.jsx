import { useNavigate, useLocation, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import api from "../api";
import "../public/assets/css/assignGroundstaff.css";

const AssignGroundstaff = () => {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [assignedAgency, setAssignedAgency] = useState("Loading...");
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { agencyId } = useParams();

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("eventId");

  const [namePlaceholder, setNamePlaceholder] = useState(
    "Name of ground staff",
  );
  const [numberPlaceholder, setNumberPlaceholder] = useState(
    "Enter 10-digit mobile number",
  );

  useEffect(() => {
    if (!agencyId) return;

    const fetchAgencyName = async () => {
      try {
        const response = await api.get(`backend/agency/${agencyId}`);
        if (response.data?.success) {
          setAssignedAgency(response.data.data.agency_name);
        } else {
          setAssignedAgency("Agency");
        }
      } catch {
        setAssignedAgency("Agency");
      }
    };

    fetchAgencyName();
  }, [agencyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.number || !formData.address) {
      setMessage("Please fill all fields before submitting.");
      return;
    }

    try {
      const payload = { ...formData, agencyId };
      const response = await api.post("backend/agency/addgroundstaff", payload);

      if (response.data?.success) {
        setMessage("Ground staff added successfully!");
        setFormData({ name: "", number: "", address: "" });

        eventId
          ? navigate(`/eventReport/${eventId}`)
          : navigate(`/dashboard/${agencyId}`);
      } else {
        setMessage("Failed to add ground staff.");
      }
    } catch {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="assign-ground-staff-wrapper">
      {/* HEADER */}
      <header className="assign-header">
        <div className="assign-header-container">
          <div className="assign-header-content">
            <div
              className="assign-logo"
              onClick={() => navigate(`/dashboard/${agencyId}`)}
            >
              <img
                src="/images/omnivision-logo.png"
                alt="Logo"
                className="assign-logo-image"
              />
            </div>

            <div className="assign-header-title">
              <h1>Ground Staff Registration</h1>
            </div>

            <div className="assign-menu-toggle" onClick={() => setIsOpen(true)}>
              <img
                src="/images/menu-bar.svg"
                alt="Menu"
                className="assign-menu-icon"
              />
            </div>
          </div>
        </div>
      </header>

      {isOpen && (
        <div className="assign-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div className={`assign-sidebar ${isOpen ? "assign-sidebar-open" : ""}`}>
        <div className="assign-sidebar-content">
          <button
            onClick={() => setIsOpen(false)}
            className="assign-sidebar-close"
          >
            ✕
          </button>

          <ul className="assign-sidebar-menu">
            <li>
              <button
                onClick={() => navigate(`/dashboard/${agencyId}`)}
                className="assign-sidebar-menu-item"
              >
                Home
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* MAIN */}
      <main className="assign-main-content">
        <div className="assign-container">
          <div className="assign-form-card">
            {/* CARD HEADER */}
            <div className="assign-card-header">
              <div className="assign-card-header-content">
                <div className="assign-card-icon">
                  <img src="/images/On-boarding.png" alt="Onboarding" />
                </div>
                <h2>Add Ground Staff</h2>
              </div>
            </div>

            {/* CARD BODY */}
            <div className="assign-card-body">
              <form onSubmit={handleSubmit} className="assign-form">
                <div className="assign-form-row">
                  <div className="assign-form-group">
                    <label className="assign-form-label">
                      Full Name <span className="assign-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder={namePlaceholder}
                      className="assign-form-input"
                      onChange={(e) => {
                        if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                          handleChange(e);
                          setNamePlaceholder("Name of ground staff");
                        }
                      }}
                      onBlur={(e) => {
                        const valid = e.target.value
                          .trim()
                          .split(" ")
                          .every((w) => /^[A-Z][a-z]*$/.test(w));
                        if (!valid && e.target.value) {
                          setNamePlaceholder(
                            "Each word must start with a capital letter",
                          );
                          setFormData((p) => ({ ...p, name: "" }));
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="assign-form-group">
                    <label className="assign-form-label">
                      Mobile Number <span className="assign-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="number"
                      maxLength={10}
                      value={formData.number}
                      placeholder={numberPlaceholder}
                      className="assign-form-input"
                      onChange={(e) => {
                        if (/^\d{0,10}$/.test(e.target.value)) {
                          handleChange(e);
                          setNumberPlaceholder("Enter 10-digit mobile number");
                        }
                      }}
                      onBlur={(e) => {
                        if (
                          !/^[6-9]\d{9}$/.test(e.target.value) &&
                          e.target.value
                        ) {
                          setNumberPlaceholder(
                            "Number must start with 9, 7 or 8",
                          );
                          setFormData((p) => ({ ...p, number: "" }));
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="assign-form-group">
                  <label className="assign-form-label">
                    Address <span className="assign-required">*</span>
                  </label>
                  <textarea
                    name="address"
                    rows="4"
                    value={formData.address}
                    onChange={handleChange}
                    className="assign-form-textarea"
                    required
                  />
                </div>

                <div className="assign-form-actions">
                  <button
                    type="submit"
                    className="assign-btn assign-btn-submit"
                  >
                    Submit
                  </button>

                  <button
                    type="button"
                    className="assign-btn assign-btn-back"
                    onClick={() =>
                      eventId
                        ? navigate(`/eventReport/${eventId}`)
                        : navigate(`/dashboard/${agencyId}`)
                    }
                  >
                    Back
                  </button>
                </div>

                {message && (
                  <div
                    className={`assign-message ${
                      message.includes("success")
                        ? "assign-message-success"
                        : "assign-message-error"
                    }`}
                  >
                    <p>{message}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="assign-footer">
        © 2026 OmniVision. All rights reserved.
      </footer>
    </div>
  );
};

export default AssignGroundstaff;
