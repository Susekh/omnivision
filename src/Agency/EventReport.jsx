import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import MapCanvas from "../components/mapCanvas";
import normalizeImageUrl from "../utils/normalizeMinioImgUrl";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";

const EventReport = () => {
  const [anchorEl, setAnchorEl] = React.useState();
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const { event_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [agencyGroundStaff, setAgencyGroundStaff] = useState([]);
  const { agencyId } = useParams();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!event_id) {
      console.error("Event ID is missing");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.get(`backend/event-report/${event_id}`);
        console.log("API Response:", response.data);
        setReportData(response.data);
        setIsAssigned(response.data.status === "Assigned");
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [event_id]);

  useEffect(() => {
    if (!reportData || !reportData.AgencyId) {
      return;
    }

    const fetchAgencyGroundStaff = async () => {
      try {
        const response = await api.get(
          `backend/${reportData.AgencyId}/groundstaff`
        );
        if (response.data.success) {
          setAgencyGroundStaff(response.data.data);
        } else {
          console.error("Failed to fetch ground staff");
        }
      } catch (error) {
        console.error("Error fetching ground staff by agency:", error);
      }
    };

    fetchAgencyGroundStaff();
  }, [reportData]);

  const handleUserChange = (event) => {
    const userId = event.target.value;
    setSelectedUser(userId);

    const user = users.find((u) => u.id === userId);
    setUserDetails(user || null);
  };

  const handleUnassign = async () => {
    try {
      const response = await api.put(`backend/events/status/${event_id}`, {
        status: "Unassigned",
        groundStaffName: null,
        assignment_time: null,
      });
      if (response.status === 200) {
        setIsAssigned(false);
        setUserDetails(null);
        setSelectedUser("");
      }
    } catch (error) {
      console.error("Error unassigning ground staff:", error);
    }
  };

  const handleAddGroundStaff = () => {
    if (reportData?.AgencyId && reportData?.event_id) {
      navigate(
        `/assignGroundstaff?agencyId=${reportData.AgencyId}&eventId=${reportData.event_id}`
      );
    } else {
      console.error("Agency ID or Event ID is not available");
    }
  };

  const updateEventStatus = async (newStatus) => {
    try {
      const response = await api.put(`backend/events/status/${event_id}`, {
        status: newStatus,
      });
      if (response.status === 200) {
        console.log(`Event ${event_id} status updated to ${newStatus}`);
        setIsAssigned(newStatus === "Assigned");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      console.error("No ground staff selected");
      return;
    }

    try {
      const selectedStaff = agencyGroundStaff.find(
        (staff) => staff._id === selectedUser
      );

      if (!selectedStaff) {
        console.error("Selected ground staff not found");
        return;
      }

      const response = await api.put(`backend/events/status/${event_id}`, {
        status: "Assigned",
        groundStaffName: selectedStaff.name,
        assignment_time: new Date().toISOString(),
      });

      if (response.status === 200) {
        console.log(`Event ${event_id} assigned to ${selectedStaff.name}`);
        setIsAssigned(true);
        navigate(`/dashboard/${reportData.AgencyId}`);
      }
    } catch (error) {
      console.error("Error assigning ground staff:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-blue-800 font-medium">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Found</h2>
            <p className="text-gray-600">No data found for event {event_id}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = reportData?.assignments_time
    ? new Date(reportData.assignments_time).toLocaleDateString()
    : "N/A";

  const formattedTime = reportData?.assignments_time
    ? new Date(reportData.assignments_time).toLocaleTimeString()
    : "N/A";

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate(`/dashboard/agencyId=${agencyId}`)}
            >
              <img
                src="/images/omnivision-logo-small.png"
                alt="Logo"
                className="h-12 md:h-14 w-auto"
              />
            </div>

            {/* Account Menu */}
            <Box sx={{ display: "flex", alignItems: "center", textAlign: "center" }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar sx={{ width: 52, height: 52, bgcolor: "#0891b2" }}>
                    <img src="/images/adminlogo.ico" alt="Admin" className="w-full h-full object-cover" />
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  mt: 1.5,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem onClick={handleClose} sx={{ py: 2 }}>
                <img
                  src="/images/enterprise.png"
                  style={{ width: 42, height: 42 }}
                  alt=""
                />
                <div style={{ marginLeft: "20px", fontWeight: "600", fontSize: "16px", color: "#1e293b" }}>
                  <Link to="/dashboard" className="no-underline text-inherit">
                    <h5 className="m-0">AGENCY</h5>
                  </Link>
                </div>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                <Link to="/assignGroundstaff" className="no-underline text-inherit">
                  Add Ground Staff
                </Link>
              </MenuItem>
              <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </div>
      </header>

      {/* Page Heading */}
      <section className="bg-linear-to-r from-blue-600 via-cyan-600 to-blue-700 text-white py-8 md:py-10 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            {reportData.assignedAgency}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Report Details Card */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl border border-blue-100">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <img
                  src="/images/dashboard-icon.png"
                  alt="Dashboard"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Report</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center border-b border-blue-100 pb-4">
                  <span className="font-semibold text-blue-900 w-full sm:w-1/3 mb-1 sm:mb-0">Report ID:</span>
                  <span className="text-gray-700 font-medium">{reportData.event_id}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center border-b border-blue-100 pb-4">
                  <span className="font-semibold text-blue-900 w-full sm:w-1/3 mb-1 sm:mb-0">Object Detected:</span>
                  <span className="text-gray-700 font-medium">{reportData.description}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center border-b border-blue-100 pb-4">
                  <span className="font-semibold text-blue-900 w-full sm:w-1/3 mb-1 sm:mb-0">Date of Reporting:</span>
                  <span className="text-gray-700 font-medium">{formattedDate}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-semibold text-blue-900 w-full sm:w-1/3 mb-1 sm:mb-0">Time of Reporting:</span>
                  <span className="text-gray-700 font-medium">{formattedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Card */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl border border-blue-100">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <img
                  src="/images/location.png"
                  alt="Location"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Location</h2>
            </div>

            <div className="relative h-80 md:h-96">
              {mapCoordinates ? (
                <MapCanvas coordinates={mapCoordinates} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-50 to-cyan-50">
                  <p className="text-blue-600 font-medium text-center px-4">
                    📍 Click the pin button to view location
                  </p>
                </div>
              )}

              <button
                className="absolute top-4 right-4 bg-white hover:bg-blue-50 text-2xl w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center border-2 border-blue-200"
                title="Go to Event Location"
                onClick={() =>
                  setMapCoordinates({
                    lat: parseFloat(reportData.latitude),
                    lng: parseFloat(reportData.longitude),
                  })
                }
              >
                📍
              </button>
            </div>
          </div>
        </div>

        {/* Image and Assignment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
          {/* Image Card */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl border border-blue-100">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <img
                  src="/images/image-icon.png"
                  alt="Gallery Icon"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Image</h2>
            </div>

            <div className="p-6 flex items-center justify-center bg-linear-to-br from-blue-50 to-cyan-50">
              <figure className="m-0">
                <img
                  src={normalizeImageUrl(reportData.image_url)}
                  alt="Incident"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                  style={{
                    transform: "rotate(-90deg)",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              </figure>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-4">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Assign To</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={handleAddGroundStaff}
                  disabled={isAssigned}
                >
                  Onboard Ground Staff
                </button>
                <button
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
                  onClick={() => navigate(`/dashboard/${reportData.AgencyId}`)}
                >
                  Back
                </button>
              </div>

              {/* Ground Staff Selection */}
              <div>
                <label
                  htmlFor="agencyGroundStaffSelect"
                  className="block text-sm font-semibold text-blue-900 mb-2"
                >
                  Select Ground Staff:
                </label>
                <select
                  id="agencyGroundStaffSelect"
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-700"
                  value={selectedUser}
                  onChange={(e) => {
                    const userId = e.target.value;
                    setSelectedUser(userId);
                    const selectedStaff = agencyGroundStaff.find(
                      (staff) => staff._id === userId
                    );
                    setUserDetails(selectedStaff || null);
                  }}
                >
                  <option value="">Select Ground Staff</option>
                  {agencyGroundStaff.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} - {staff.number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Staff Details */}
              {userDetails && (
                <div className="mt-5 bg-linear-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3 text-lg">Staff Details</h3>
                  <ul className="space-y-2 list-none p-0">
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-800 w-20">Name:</span>
                      <span className="text-gray-700">{userDetails.name}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-800 w-20">Phone:</span>
                      <span className="text-gray-700">{userDetails.number}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-blue-800 w-20">Address:</span>
                      <span className="text-gray-700">{userDetails.address}</span>
                    </li>
                  </ul>

                  <div className="flex gap-3 mt-5">
                    <button
                      className="flex-1 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      onClick={handleAssign}
                      disabled={isAssigned}
                    >
                      Assign
                    </button>
                    <button
                      className="flex-1 px-6 py-3 bg-linear-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      onClick={handleUnassign}
                    >
                      Unassign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur mt-12 py-8 text-center border-t border-blue-100">
        <img
          src="/images/footer-bg.png"
          alt=""
          className="mx-auto mb-4 max-w-full h-auto"
          style={{ maxHeight: "60px" }}
        />
        <p className="text-sm text-gray-600">
          © 2025 OmniVision. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default EventReport;