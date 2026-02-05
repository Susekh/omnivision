import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";

const AssignGroundStaff = () => {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    address: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [assignedAgency, setAssignedAgency] = useState("Loading...");
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("eventId");
  const agencyId = queryParams.get("agencyId");

  const [isOpen, setIsOpen] = useState(false);
  const [namePlaceholder, setNamePlaceholder] = useState(
    "Name of ground staff",
  );
  const [numberPlaceholder, setNumberPlaceholder] = useState(
    "Enter 10-digit mobile number",
  );

  /* =========================
     FETCH AGENCY NAME
     ========================= */
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

        if (eventId) navigate(`/eventReport/${eventId}`);
        else if (agencyId) navigate(`/dashboard/${agencyId}`);
      } else {
        setMessage("Failed to add ground staff.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error(error);
    }
  };

  return (
    /* PAGE BACKGROUND → WHITE */
    <div className="min-h-screen flex flex-col bg-white">
      {/* ================= HEADER (GRADIENT ONLY HERE) ================= */}
      <header className="sticky top-0 z-50 bg-linear-to-r from-[#1f6fb2] via-[#4fa3e3] to-[#9fd3ff] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div
              className="shrink-0 cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate(`/dashboard/${agencyId}`)}
            >
              <img
                src="/image/omnivision-logo.png"
                alt="Logo"
                className="h-16 w-auto bg-transparent p-2"
              />
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-wide">
                {assignedAgency}
              </h1>
            </div>

            <div
              className="cursor-pointer p-2 hover:bg-white/20 rounded-lg transition-all"
              onClick={() => setIsOpen(true)}
            >
              <img
                src="/billioneye/images/menu-bar.svg"
                alt="Menu"
                className="h-7 w-7 brightness-0 invert"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-linear-to-b from-[#1f6fb2] via-[#4fa3e3] to-[#9fd3ff] shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full justify-between p-6">
          <div>
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white text-3xl hover:bg-white/20 w-10 h-10 rounded-full"
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => navigate(`/dashboard/${agencyId}`)}
              className="w-full px-6 py-3 bg-white text-[#1f6fb2] rounded-lg font-semibold hover:bg-[#1f6fb2] hover:text-white transition-all shadow-md"
            >
              Home
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-[#1f6fb2] mb-6">
            Ground Staff Registration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={namePlaceholder}
                className="w-full border px-4 py-3 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Mobile Number *
              </label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder={numberPlaceholder}
                maxLength={10}
                className="w-full border px-4 py-3 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="4"
                className="w-full border px-4 py-3 rounded-lg"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Submit
              </button>

              <button
                type="button"
                onClick={() =>
                  eventId
                    ? navigate(`/eventReport/${eventId}`)
                    : navigate(`/dashboard/${agencyId}`)
                }
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
              >
                Back
              </button>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("success")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-100 text-center py-4">
        <p className="text-gray-600 text-sm">
          © 2026 OmniVision. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AssignGroundStaff;
