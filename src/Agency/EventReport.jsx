import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../public/assets/css/EventReport.css";
import api from "../api";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const flagIconUrl = "/images/map-pin.png";

const FlyToLocation = ({ targetLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 17);
    }
  }, [targetLocation, map]);
  return null;
};

const createFlagIcon = () =>
  L.icon({
    iconUrl: flagIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

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

  // Map states for interactive features
  const [markers, setMarkers] = useState([]);
  const [targetLocation, setTargetLocation] = useState([20.2961, 85.8245]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const addFlagAt = (lat, lng, name) => {
    const newMarker = {
      position: [lat, lng],
      name: name || "Flag",
      icon: createFlagIcon(),
    };
    setMarkers((prev) => [...prev, newMarker]);
    setTargetLocation([lat, lng]);
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

        // Set map coordinates if available
        if (response.data.latitude && response.data.longitude) {
          const coords = {
            lat: parseFloat(response.data.latitude),
            lng: parseFloat(response.data.longitude),
          };
          setMapCoordinates(coords);
          setTargetLocation([coords.lat, coords.lng]);
          addFlagAt(coords.lat, coords.lng, "Event Location");
        }
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
          `backend/${reportData.AgencyId}/groundstaff`,
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
        `/assignGroundstaff/${reportData.AgencyId}?eventId=${reportData.event_id}`,
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
        (staff) => staff._id === selectedUser,
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
    return <p>Loading report data...</p>;
  }

  if (!reportData) {
    return <p>No data found for event {event_id}</p>;
  }

  const isoDate = reportData?.assignments_time?.$date;

  const formattedDate = isoDate
    ? new Date(isoDate).toLocaleDateString()
    : "N/A";

  const formattedTime = isoDate
    ? new Date(isoDate).toLocaleTimeString()
    : "N/A";

  return (
    <section className="event-report-wrapper">
      <header className="event-report-header">
        <div className="container">
          <div className="header-content">
            <div
              className="logo"
              onClick={() => navigate(`/dashboard/${reportData.AgencyId}`)}
            >
              <img src="/images/omnivision-logo.png" alt="Logo" />
            </div>
            <div className="header-title">
              <h1>{reportData.assignedAgency}</h1>
            </div>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar sx={{ width: 48, height: 48, bgcolor: "#fff" }}>
                    <img
                      src="/images/adminlogo.ico"
                      alt="Admin"
                      style={{ width: "100%" }}
                    />
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
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              {/* <MenuItem onClick={handleClose}>
                <img
                  src="/images/enterprise.png"
                  style={{ width: 42, height: 42, marginRight: 15 }}
                  alt=""
                />
                <Link to="/dashboard">
                  <h5 style={{ margin: 0 }}>AGENCY</h5>
                </Link>
              </MenuItem> */}
              <Divider />
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                <Link
                  to={`/assignGroundstaff/${reportData.AgencyId}?eventId=${reportData.event_id}`}
                >
                  Add Ground Staff
                </Link>
              </MenuItem>
              {/* <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem> */}
            </Menu>
          </div>
        </div>
      </header>

      <div className="event-report-content">
        <div className="container">
          <div className="report-row">
            <div className="report-col report-col-left">
              <div className="info-card">
                <div className="card-header">
                  <img src="/images/dashboard-icon.png" alt="Report" />
                  <h4>REPORT DETAILS</h4>
                </div>
                <div className="card-body">
                  <table className="info-table">
                    <tbody>
                      <tr>
                        <td>
                          <strong>Report ID:</strong>
                        </td>
                        <td>{reportData.event_id}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Object Detected:</strong>
                        </td>
                        <td>{reportData.description}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Date of Reporting:</strong>
                        </td>
                        <td>{formattedDate}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Time of Reporting:</strong>
                        </td>
                        <td>{formattedTime}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="report-col report-col-right">
              <div className="map-section-open">
                <div className="map-header">
                  <img src="/images/location.png" alt="Location" />
                  <h4>LOCATION</h4>
                </div>
                <div className="map-container">
                  {mapCoordinates ? (
                    <MapContainer
                      center={targetLocation}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {targetLocation && (
                        <FlyToLocation targetLocation={targetLocation} />
                      )}
                      {markers.map((marker, idx) => (
                        <Marker
                          key={idx}
                          position={marker.position}
                          icon={marker.icon}
                        >
                          <Popup>{marker.name}</Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  ) : (
                    <p className="map-placeholder">
                      Click 📍 on an event to view its location.
                    </p>
                  )}
                  <button
                    className="map-pin-btn"
                    title="Go to Event Location"
                    onClick={() => {
                      if (reportData.latitude && reportData.longitude) {
                        setMapCoordinates({
                          lat: parseFloat(reportData.latitude),
                          lng: parseFloat(reportData.longitude),
                        });
                        addFlagAt(
                          parseFloat(reportData.latitude),
                          parseFloat(reportData.longitude),
                          "Event Location",
                        );
                      }
                    }}
                  >
                    📍
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="report-row">
            <div className="report-col report-col-left">
              <div className="info-card">
                <div className="card-header">
                  <img src="/images/image-icon.png" alt="Incident" />
                  <h4>INCIDENT IMAGE</h4>
                </div>
                <div className="card-body image-body">
                  <figure className="incident-image">
                    <img
                      src={normalizeImageUrl(reportData.image_url)}
                      alt="Incident"
                    />
                  </figure>
                </div>
              </div>
            </div>

            <div className="report-col report-col-right">
              <div className="info-card">
                <div className="card-header">
                  <h4>ASSIGN TO GROUND STAFF</h4>
                </div>
                <div className="card-body">
                  <div className="action-buttons">
                    <button
                      className="btn mr-4 btn-primary"
                      onClick={handleAddGroundStaff}
                      disabled={isAssigned}
                    >
                      Onboard GroundStaff
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        navigate(`/dashboard/${reportData.AgencyId}`)
                      }
                    >
                      Back to Dashboard
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor="agencyGroundStaffSelect">
                      Select Ground Staff:
                    </label>
                    <select
                      id="agencyGroundStaffSelect"
                      className="form-control"
                      value={selectedUser}
                      onChange={(e) => {
                        const userId = e.target.value;
                        setSelectedUser(userId);
                        const selectedStaff = agencyGroundStaff.find(
                          (staff) => staff._id === userId,
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

                  {userDetails && (
                    <div className="assign-details-card">
                      <h5>Selected Staff Details</h5>
                      <ul>
                        <li>
                          <strong>Name:</strong> {userDetails.name}
                        </li>
                        <li>
                          <strong>Phone:</strong> {userDetails.number}
                        </li>
                        <li>
                          <strong>Address:</strong> {userDetails.address}
                        </li>
                      </ul>
                      <div className="assign-actions">
                        <button
                          className="btn btn-success"
                          onClick={handleAssign}
                          disabled={isAssigned}
                        >
                          Assign
                        </button>
                        <button
                          className="btn btn-danger"
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventReport;
