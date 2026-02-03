import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "../public/assets/css/Dashboard.css";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import normalizeImageUrl from "../utils/normalizeMinioImgUrl";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { auto } from "@popperjs/core";

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

// ─── Icon mapping for event types ────────────────────────────────────────────
const getEventIcon = (type) => {
  const lower = (type || "").toLowerCase();
  if (lower.includes("road")) return "🛣️";
  if (lower.includes("pothole")) return "⛓️";
  if (lower.includes("flood")) return "🌊";
  if (lower.includes("fire")) return "🔥";
  if (lower.includes("accident")) return "🚨";
  if (lower.includes("healthcare")) return "🏥";
  if (lower.includes("tree")) return "🌳";
  if (lower.includes("water")) return "💧";
  if (lower.includes("electric")) return "⚡";
  if (lower.includes("waste")) return "🗑️";
  if (lower.includes("building")) return "🏗️";
  if (lower.includes("street light") || lower.includes("daytime")) return "💡";
  if (lower.includes("environmental")) return "🌿";
  if (lower.includes("damage")) return "💥";
  return "📍";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { agencyId } = useParams();
  const [assignedAgency, setAssignedAgency] = useState("Loading...");
  const [dashboardData, setDashboardData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("RecentReports");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const imgRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [targetLocation, setTargetLocation] = useState([20.2961, 85.8245]);
  const [selectedEventType, setSelectedEventType] = useState(null);

  useEffect(() => {
    if (!agencyId) return;

    const fetchDashboardData = async () => {
      try {
        const response = await api.get(`backend/agency-dashboard/${agencyId}`);

        setDashboardData(response.data?.assignedEvents || []);
        setAssignedAgency(response.data?.AgencyName || "Unknown Agency");

        console.log(`Logged in as ${response.data?.AgencyName} (${agencyId})`);
        console.log(
          `Showing ${response.data?.assignedEvents?.length || 0} incidents`,
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setAssignedAgency("Error loading agency");
      }
    };

    fetchDashboardData();
  }, [agencyId]);

  const addFlagAt = (lat, lng, name) => {
    const newMarker = {
      position: [lat, lng],
      name: name || "Flag",
      icon: createFlagIcon(),
    };
    setMarkers((prev) => [...prev, newMarker]);
    setTargetLocation([lat, lng]);
  };

  const updateEventStatus = async (event_id, newStatus, agencyId = null) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === "Accepted" && agencyId) {
        payload.agencyId = agencyId;
      }
      const response = await api.put(
        `backend/events/status/${event_id}`,
        payload,
      );
      if (response.status === 200) {
        setDashboardData((prevData) =>
          prevData.map((event) =>
            event.event_id === event_id
              ? { ...event, status: newStatus }
              : event,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const approveEvent = (event_id) => {
    updateEventStatus(event_id, "open", agencyId);
    navigate(`/eventReport/${event_id}`, { state: { event_id } });
  };
  const rejectEvent = (event_id) => updateEventStatus(event_id, "Rejected");
  const handleAssign = (event_id) => updateEventStatus(event_id, "Assigned");
  const handleComplete = (event_id) => updateEventStatus(event_id, "closed");

  const tabs = [
    { id: "RecentReports", label: "Recent Reports" },
    { id: "AssignedEvents", label: "Assigned Events" },
    { id: "ResolvedEvents", label: "Resolved Events" },
  ];

  const filteredDashboardData = () => {
    let data = dashboardData;
    if (selectedEventType) {
      data = data.filter(
        (event) =>
          (event.description || "").toLowerCase() ===
          selectedEventType.toLowerCase(),
      );
    }
    switch (activeTab) {
      case "RecentReports":
        return data.filter((event) => event.status === "open");
      case "AssignedEvents":
        return data.filter((event) => event.status === "Assigned");
      case "ResolvedEvents":
        return data.filter(
          (event) => event.status === "closed" || event.status === "Rejected",
        );
      default:
        return data;
    }
  };

  const eventTypeSummary = (() => {
    const map = {};
    dashboardData.forEach((event) => {
      const type = event.description || "Unknown";
      if (!map[type]) map[type] = { total: 0, open: 0, assigned: 0, closed: 0 };
      map[type].total += 1;
      if (event.status === "open") map[type].open += 1;
      if (event.status === "Assigned") map[type].assigned += 1;
      if (event.status === "closed" || event.status === "Rejected")
        map[type].closed += 1;
    });
    return Object.entries(map).map(([type, counts]) => ({ type, ...counts }));
  })();

  const renderEventActions = (event) => {
    switch (event.status) {
      case "open":
        return (
          <>
            <button
              className="btn btn-success"
              onClick={() => approveEvent(event.event_id)}
            >
              Accept
            </button>
            <button
              className="btn btn-danger"
              onClick={() => rejectEvent(event.event_id)}
              style={{ marginLeft: "10px" }}
            >
              Reject
            </button>
          </>
        );
      case "Accepted":
        return (
          <button
            className="btn btn-primary"
            onClick={() => handleAssign(event.event_id)}
          >
            Assign
          </button>
        );
      case "Assigned":
        return (
          <>
            <button
              className="btn btn-success"
              onClick={() => handleComplete(event.event_id)}
            >
              Complete
            </button>
            <button
              className="btn btn-danger"
              onClick={() => rejectEvent(event.event_id)}
            >
              Reject
            </button>
            <h4>{event.ground_staff}</h4>
          </>
        );
      case "closed":
        return <p>Task Completed</p>;
      case "Rejected":
        return <p>Rejected</p>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!zoomedImageUrl) return;
    const img = imgRef.current;
    const canvas = document.getElementById("zoomed-canvas");
    const ctx = canvas?.getContext("2d");
    if (img && canvas && ctx) {
      img.onload = () => {
        const { naturalWidth, naturalHeight, width, height } = img;
        const scaleX = width / naturalWidth;
        const scaleY = height / naturalHeight;
        const report = dashboardData.find(
          (event) => normalizeImageUrl(event.image_url) === zoomedImageUrl,
        );
        if (
          report &&
          Array.isArray(report.boundingBoxes) &&
          report.boundingBoxes.length > 0 &&
          report.boundingBoxes[0].length === 4
        ) {
          const [x1, y1, x2, y2] = report.boundingBoxes[0];
          const adjustedBox = {
            left: x1 * scaleX,
            top: y1 * scaleY,
            width: (x2 - x1) * scaleX,
            height: (y2 - y1) * scaleY,
          };
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            adjustedBox.left,
            adjustedBox.top,
            adjustedBox.width,
            adjustedBox.height,
          );
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
    }
  }, [zoomedImageUrl, dashboardData]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in.");
        navigate("/login");
        return;
      }
      const response = await api.post(
        "backend/agency/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.status === 200) {
        localStorage.removeItem("token");
        alert("Logout Successful!");
        navigate("/agencyLogin");
      } else {
        alert("Logout Failed: " + (response.data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error Logging Out:", error);
      alert(error.response?.data?.message || "Logout failed!");
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(dashboardData.length / eventsPerPage))
      setCurrentPage((p) => p + 1);
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = Math.min(startIndex + eventsPerPage, dashboardData.length);
  const currentEvents = dashboardData.slice(startIndex, endIndex);

  // ── Event-type cards grid ─────────────────────────────────────────────────
  const renderEventTypeCards = () => (
    <div className="event-type-cards-wrapper">
      <div className="event-type-cards-header">
        <div className="event-type-cards-header-icon">
          <img
            src="/images/dashboard-icon.png"
            alt="Dashboard Icon"
            title="Dashboard Icon"
          />
        </div>
        <h4>Event Categories</h4>
      </div>

      {eventTypeSummary.length === 0 ? (
        <div className="event-type-cards-empty">
          <span className="event-type-cards-empty-icon">📋</span>
          <p>No events available</p>
        </div>
      ) : (
        <div className="event-type-cards-grid">
          {eventTypeSummary.map((item, idx) => (
            <div
              key={idx}
              className="event-type-card"
              onClick={() => {
                setSelectedEventType(item.type);
                setActiveTab("RecentReports");
              }}
            >
              <div className="event-type-card-accent" />
              <div className="event-type-card-icon-wrap">
                <span className="event-type-card-icon">
                  {getEventIcon(item.type)}
                </span>
              </div>
              <h5 className="event-type-card-title">{item.type}</h5>
              <div className="event-type-card-stats">
                <div className="event-type-card-stat event-type-card-stat--open">
                  <span className="event-type-card-stat-dot event-type-card-stat-dot--open" />
                  <span>{item.open} Open</span>
                </div>
                <div className="event-type-card-stat event-type-card-stat--assigned">
                  <span className="event-type-card-stat-dot event-type-card-stat-dot--assigned" />
                  <span>{item.assigned} Assigned</span>
                </div>
                <div className="event-type-card-stat event-type-card-stat--closed">
                  <span className="event-type-card-stat-dot event-type-card-stat-dot--closed" />
                  <span>{item.closed} Resolved</span>
                </div>
              </div>
              <div className="event-type-card-total">
                {item.total} {item.total === 1 ? "Event" : "Events"}
              </div>
              <div className="event-type-card-cta">View Details →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Detail table (after clicking a card) ─────────────────────────────────
  const renderDetailTable = () => (
    <div className="table-card" style={{ height: "700px" }}>
      <div className="table-card-heading">
        <div className="table-card-heading-icon">
          <img
            src="/images/dashboard-icon.png"
            alt="Dashboard Icon"
            title="Dashboard Icon"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="event-type-back-btn"
            onClick={() => {
              setSelectedEventType(null);
              setActiveTab("RecentReports");
            }}
          >
            ← Back
          </button>
          <h4 style={{ margin: 0 }}>{selectedEventType}</h4>
        </div>
        <button onClick={() => setIsPopupOpen(true)} className="table-card-btn">
          View All <i className="fa-solid fa-play"></i>
        </button>
      </div>

      <div className="table-con table-responsive">
        <ul
          className="nav nav-tabs"
          style={{ marginLeft: 0, gap: "8px", flexWrap: "wrap" }}
        >
          {tabs.map((tab) => (
            <li key={tab.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content">
          <div style={{ maxHeight: "550px", overflowY: "auto" }}>
            <table className="event-table">
              <tr>
                <th>Sl.No</th>
                <th>Type</th>
                <th>Date and Time</th>
                <th>Location</th>
                <th>Images</th>
                <th>Status View</th>
              </tr>
              <tbody>
                {filteredDashboardData().length > 0 ? (
                  filteredDashboardData().map((report, index) => (
                    <tr key={report.event_id || index}>
                      <td>{index + 1}</td>
                      <td>{report.description}</td>
                      <td>
                        {report.assignment_time
                          ? new Date(report.assignment_time).toLocaleString()
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          style={{
                            color: "#007bff",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: "8px",
                          }}
                          title="View Location"
                          onClick={() =>
                            addFlagAt(
                              parseFloat(report.latitude),
                              parseFloat(report.longitude),
                              "flag",
                            )
                          }
                        >
                          📍View In Map
                        </button>
                      </td>
                      <td>
                        {report.image_url ? (
                          <div
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <img
                              src={normalizeImageUrl(report.image_url)}
                              alt={`Event ${report.event_id}`}
                              title="Click to zoom"
                              className="default-class"
                              onClick={() =>
                                setZoomedImageUrl(
                                  normalizeImageUrl(report.image_url),
                                )
                              }
                              style={{
                                cursor: "zoom-in",
                                maxWidth: "100px",
                                borderRadius: "6px",
                                maxHeight: "62px",
                                display: "block",
                                zIndex: 0,
                              }}
                              onLoad={(e) => {
                                const img = e.target;
                                const canvas = document.getElementById(
                                  `canvas-${report.event_id}`,
                                );
                                const ctx = canvas?.getContext("2d");
                                if (!ctx) return;
                                let x1, y1, x2, y2;
                                if (
                                  typeof report.x1 === "number" &&
                                  typeof report.y1 === "number" &&
                                  typeof report.x2 === "number" &&
                                  typeof report.y2 === "number"
                                ) {
                                  ({ x1, y1, x2, y2 } = report);
                                } else if (
                                  Array.isArray(report.boundingBoxes) &&
                                  Array.isArray(report.boundingBoxes[0]) &&
                                  report.boundingBoxes[0].length === 4
                                ) {
                                  [x1, y1, x2, y2] = report.boundingBoxes[0];
                                } else {
                                  return;
                                }
                                canvas.width = img.clientWidth;
                                canvas.height = img.clientHeight;
                                requestAnimationFrame(() => {
                                  const scaleX =
                                    img.clientWidth / img.naturalWidth;
                                  const scaleY =
                                    img.clientHeight / img.naturalHeight;
                                  ctx.clearRect(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height,
                                  );
                                  ctx.strokeStyle = "red";
                                  ctx.lineWidth = 2;
                                  ctx.strokeRect(
                                    x1 * scaleX,
                                    y1 * scaleY,
                                    (x2 - x1) * scaleX,
                                    (y2 - y1) * scaleY,
                                  );
                                });
                              }}
                            />
                            <canvas
                              id={`canvas-${report.event_id}`}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                                display: zoomedImageUrl ? "none" : "block",
                              }}
                            />
                          </div>
                        ) : (
                          "No Image"
                        )}
                      </td>
                      <td>{renderEventActions(report)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No events found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                onClick={() => navigate(`/dashboard/${agencyId}`)}
                className="logo-image"
              />
            </div>
            <div className="header-title">
              <h1>{assignedAgency}</h1>
            </div>
            <div className="menu-toggle" onClick={() => setIsOpen(true)}>
              <img src="/images/menu-bar.svg" alt="Menu" />
            </div>
          </div>
        </div>

        {/* Slide-out sidebar */}
        <div className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <span className="sidebar-close" onClick={() => setIsOpen(false)}>
                ✕
              </span>
            </div>
            <ul className="sidebar-menu">
              <Link to={`/dashboard/${agencyId}`} className="sidebar-link">
                <li className="sidebar-menu-item">Home</li>
              </Link>
              <Link
                to={`/assignGroundstaff/?agencyId=${agencyId}`}
                className="sidebar-link"
              >
                <li className="sidebar-menu-item">Onboard GroundStaff</li>
              </Link>
            </ul>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* ─── MAIN BODY: Cards/Table + Map ────────────────────────────────── */}
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            minHeight: auto,
            boxSizing: "border-box",
            overflow: "visible",
          }}
        >
          {/* Left 70% – cards or table */}
          <section
            style={{
              width: "70%",
              height: "52%",
              padding: "10px",
              boxSizing: "border-box",
              margin: "10px",
            }}
          >
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  {selectedEventType === null
                    ? renderEventTypeCards()
                    : renderDetailTable()}
                </div>
              </div>
            </div>
          </section>

          {/* Right 30% – map */}
          <section
            style={{
              width: "30%",
              height: "75%",
              background: "linear-gradient(to bottom, #e0f7fa, #fce4ec)",
              padding: "10px",
              boxSizing: "border-box",
              borderRadius: "10px",
              margin: "10px",
            }}
          >
            <div>
              <MapContainer
                center={[20.2961, 85.8245]}
                zoom={13}
                style={{ height: "690px", width: "100%" }}
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
            </div>
          </section>
        </div>
      </div>

      {/* ─── ZOOMED IMAGE OVERLAY ─────────────────────────────────────────── */}
      {zoomedImageUrl && (
        <div className="zoom-overlay" onClick={() => setZoomedImageUrl(null)}>
          <div
            className="zoomed-image-container"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <button
              className="close-button"
              style={{ marginTop: "15px", marginRight: "17px" }}
              onClick={() => setZoomedImageUrl(null)}
            >
              ✕
            </button>
            <div style={{ position: "relative", display: "inline-block" }}>
              {(() => {
                const event = dashboardData.find((ev) =>
                  ev.allIncidents.some(
                    (inc) =>
                      normalizeImageUrl(inc.image_url) === zoomedImageUrl,
                  ),
                );
                if (!event) return <p>Error loading image data.</p>;

                const currentIndex = event.allIncidents.findIndex(
                  (inc) => normalizeImageUrl(inc.image_url) === zoomedImageUrl,
                );
                if (currentIndex === -1)
                  return <p>Error loading incident data.</p>;

                const prevIndex =
                  (currentIndex - 1 + event.allIncidents.length) %
                  event.allIncidents.length;
                const nextIndex =
                  (currentIndex + 1) % event.allIncidents.length;

                return (
                  <>
                    <img
                      ref={imgRef}
                      src={zoomedImageUrl}
                      alt="Zoomed Event"
                      className="zoomed-image"
                      style={{
                        display: "block",
                        maxWidth: "80vw",
                        maxHeight: "80vh",
                      }}
                      onLoad={(e) => {
                        const img = e.target;
                        const canvas = document.getElementById("zoomed-canvas");
                        const ctx = canvas?.getContext("2d");
                        if (!ctx) return;

                        const boundingBox =
                          event.allIncidents[currentIndex]?.boundingBoxes?.[0];
                        canvas.width = img.clientWidth;
                        canvas.height = img.clientHeight;

                        if (!boundingBox || boundingBox.length !== 4) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          return;
                        }
                        const [x1, y1, x2, y2] = boundingBox;
                        if ([x1, y1, x2, y2].some(isNaN)) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          return;
                        }

                        const scaleX = img.clientWidth / img.naturalWidth;
                        const scaleY = img.clientHeight / img.naturalHeight;

                        requestAnimationFrame(() => {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          ctx.strokeStyle = "red";
                          ctx.lineWidth = 2;
                          ctx.strokeRect(
                            x1 * scaleX,
                            y1 * scaleY,
                            (x2 - x1) * scaleX,
                            (y2 - y1) * scaleY,
                          );
                        });
                      }}
                    />
                    <canvas
                      id="zoomed-canvas"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                      }}
                    />
                    <button
                      className="carousel-prev"
                      onClick={() =>
                        setZoomedImageUrl(
                          normalizeImageUrl(
                            event.allIncidents[prevIndex].image_url,
                          ),
                        )
                      }
                    >
                      ◀
                    </button>
                    <button
                      className="carousel-next"
                      onClick={() =>
                        setZoomedImageUrl(
                          normalizeImageUrl(
                            event.allIncidents[nextIndex].image_url,
                          ),
                        )
                      }
                    >
                      ▶
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL-EVENTS POPUP ─────────────────────────────────────────────── */}
      {isPopupOpen && (
        <div
          className="popup-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="popup-content"
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "80%",
              maxHeight: "80%",
              overflow: "hidden",
            }}
          >
            <h3>All Events</h3>
            <table
              className="table table-striped"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
              <tbody>
                {currentEvents.map((event, index) => (
                  <tr key={event.event_id || index}>
                    <td>{index + 1 + startIndex}</td>
                    <td>{event.description}</td>
                    <td>
                      {event.assignment_time
                        ? new Date(event.assignment_time).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      {event.assignment_time
                        ? new Date(event.assignment_time).toLocaleTimeString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="pagination"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                style={{
                  padding: "10px 20px",
                  backgroundColor: currentPage === 1 ? "#ccc" : "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of{" "}
                {Math.ceil(dashboardData.length / eventsPerPage)}
              </span>
              <button
                onClick={handleNextPage}
                disabled={
                  currentPage ===
                  Math.ceil(dashboardData.length / eventsPerPage)
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    currentPage ===
                    Math.ceil(dashboardData.length / eventsPerPage)
                      ? "#ccc"
                      : "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    currentPage ===
                    Math.ceil(dashboardData.length / eventsPerPage)
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next
              </button>
            </div>
            <button
              onClick={() => setIsPopupOpen(false)}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── FOOTER (bottom) ──────────────────────────────────────────────── */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* MAIN CONTENT */}
        <div style={{ flex: 1 }}>{/* your cards + map layout */}</div>

        {/* FOOTER */}
        <footer
          style={{
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #dee2e6",
            padding: "15px 0",
            textAlign: "center",
            width: "100%",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
            © 2025 OmniVision. All rights reserved by Neuradyne.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Dashboard;
