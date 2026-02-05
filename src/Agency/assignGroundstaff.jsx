import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import "../public/assets/css/assignGroundstaff.css";

const assignGroundstaff = () => {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    address: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("eventId");
  const [assignedAgency, setAssignedAgency] = useState("Loading...");
  const { agencyId } = useParams();

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
      } catch (error) {
        console.error("Error fetching agency name:", error);
        setAssignedAgency("Agency");
      }
    };

    fetchAgencyName();
  }, [agencyId]);

  const [isOpen, setIsOpen] = useState(false);
  const [namePlaceholder, setNamePlaceholder] = useState(
    "Name of ground staff",
  );
  const [numberPlaceholder, setNumberPlaceholder] = useState(
    "Enter 10-digit mobile number starting with 6",
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.number.trim() ||
      !formData.address.trim()
    ) {
      setMessage("Please fill all fields before submitting.");
      return;
    }
    try {
      const dataToSubmit = { ...formData, agencyId };

      const response = await api.post(
        "backend/agency/addgroundstaff",
        dataToSubmit,
      );
      if (response.data.success) {
        setMessage("Ground staff added successfully!");
        setFormData({ name: "", number: "", address: "" });

        if (eventId) {
          navigate(`/eventReport/${eventId}`);
        } else if (agencyId) {
          navigate(`/dashboard/${agencyId}`);
        }
      } else {
        setMessage("Failed to add ground staff.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="assign-ground-staff-wrapper">
      {/* Header */}
      <header className="assign-header">
        <div className="assign-header-container">
          <div className="assign-header-content">
            {/* Logo */}
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

            {/* Title */}
            <div className="assign-header-title">
              <h1>{assignedAgency}</h1>
            </div>

            {/* Menu Toggle */}
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

      {/* Backdrop */}
      {isOpen && (
        <div className="assign-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`assign-sidebar ${isOpen ? "assign-sidebar-open" : ""}`}>
        <div className="assign-sidebar-content">
          <div className="assign-sidebar-header">
            <button
              onClick={() => setIsOpen(false)}
              className="assign-sidebar-close"
            >
              ✕
            </button>
          </div>
          <nav>
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="assign-main-content">
        <div className="assign-container">
          {/* Form Card */}
          <div className="assign-form-card">
            {/* Card Header */}
            <div className="assign-card-header">
              <div className="assign-card-header-content">
                <div className="assign-card-icon">
                  <img src="/images/On-boarding.png" alt="Onboarding" />
                </div>
                <h2>Ground Staff Registration</h2>
              </div>
            </div>

            {/* Form Body */}
            <div className="assign-card-body">
              <form onSubmit={handleSubmit} className="assign-form">
                {/* Name and Mobile Number Row */}
                <div className="assign-form-row">
                  {/* Name Field */}
                  <div className="assign-form-group">
                    <label htmlFor="name" className="assign-form-label">
                      Full Name <span className="assign-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => {
                        const input = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(input)) {
                          handleChange(e);
                          setNamePlaceholder("Name of ground staff");
                        }
                      }}
                      onBlur={(e) => {
                        const input = e.target.value.trim();
                        const isValid = input
                          .split(" ")
                          .filter(Boolean)
                          .every((word) => /^[A-Z][a-z]*$/.test(word));

                        if (!isValid && input.length > 0) {
                          setNamePlaceholder(
                            "Each word should start with a capital letter (e.g., John Doe)",
                          );
                          setFormData({ ...formData, name: "" });
                        }
                      }}
                      placeholder={namePlaceholder}
                      required
                      className="assign-form-input"
                    />
                  </div>

                  {/* Mobile Number Field */}
                  <div className="assign-form-group">
                    <label htmlFor="number" className="assign-form-label">
                      Mobile Number <span className="assign-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={(e) => {
                        const input = e.target.value;
                        if (/^\d{0,10}$/.test(input)) {
                          handleChange(e);
                          setNumberPlaceholder(
                            "Enter 10-digit mobile number starting with 6",
                          );
                        }
                      }}
                      onBlur={(e) => {
                        const input = e.target.value;
                        if (!/^[6-9]\d{9}$/.test(input) && input.length > 0) {
                          setNumberPlaceholder(
                            "Mobile number must be 10 digits and start with 6, 7, 8, or 9",
                          );
                          setFormData({ ...formData, number: "" });
                        }
                      }}
                      placeholder={numberPlaceholder}
                      maxLength={10}
                      required
                      className="assign-form-input"
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div className="assign-form-group assign-form-group-full">
                  <label htmlFor="address" className="assign-form-label">
                    Address <span className="assign-required">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete address of ground staff"
                    required
                    rows="4"
                    className="assign-form-textarea"
                  />
                </div>

                {/* Action Buttons */}
                <div className="assign-form-actions">
                  <button
                    type="submit"
                    className="assign-btn assign-btn-submit"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (eventId) {
                        navigate(`/eventReport/${eventId}`);
                      } else if (agencyId) {
                        navigate(`/dashboard/${agencyId}`);
                      } else {
                        console.error(
                          "No valid eventId or agencyId to navigate back.",
                        );
                      }
                    }}
                    className="assign-btn assign-btn-back"
                  >
                    Back
                  </button>
                </div>

                {/* Message Display */}
                {message && (
                  <div
                    className={`assign-message ${
                      message.includes("successfully")
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

      {/* Footer */}
      <footer className="assign-footer">
        <div className="assign-footer-container">
          <p className="assign-footer-text">
            © 2026 OmniVision. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default assignGroundstaff;
