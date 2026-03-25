import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import normalizeImageUrl from "../utils/normalizeMinioImgUrl";
import Loader from "../components/loader";

// ── THEME ──────────────────────────────────────────────────────────────────
const T = {
  primary: "#0f4c8a",
  primaryLight: "#1a65b5",
  primaryGlow: "rgba(15,76,138,0.12)",
  bg: "#f0f4f9",
  card: "#ffffff",
  border: "#dde5f0",
  text: "#0d1b2a",
  muted: "#6b7e99",
  faint: "#e8eef6",
};

const STATUS_CFG = {
  Assigned: {
    color: "#b45309",
    bg: "#fef3c7",
    dot: "#d97706",
    label: "Assigned",
  },
  closed: {
    color: "#065f46",
    bg: "#d1fae5",
    dot: "#059669",
    label: "Completed",
  },
  Completed: {
    color: "#065f46",
    bg: "#d1fae5",
    dot: "#059669",
    label: "Completed",
  },
};

const PRIORITY_CFG = {
  Critical: { color: "#dc2626", bg: "#fee2e2", bar: "#dc2626" },
  High: { color: "#d97706", bg: "#fef3c7", bar: "#f59e0b" },
  Medium: { color: "#1a65b5", bg: "#dbeafe", bar: "#2563eb" },
  Low: { color: "#059669", bg: "#d1fae5", bar: "#10b981" },
};

// ── HELPERS ────────────────────────────────────────────────────────────────
function parseTs(ts) {
  if (!ts) return null;
  if (typeof ts === "object" && ts["$date"]) return new Date(ts["$date"]);
  return new Date(ts);
}

function formatDate(ts) {
  if (!ts) return null;
  const d = parseTs(ts);
  if (!d || isNaN(d)) return null;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${mon} ${year}, ${hh}:${mm}`;
}

function timeAgo(ts) {
  if (!ts) return null;
  const d = parseTs(ts);
  if (!d || isNaN(d)) return null;
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── LIGHTBOX ───────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "lbIn 0.18s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "92vw",
          maxHeight: "88vh",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          animation: "lbScale 0.18s ease both",
        }}
      >
        <img
          src={src}
          alt="Incident"
          style={{
            display: "block",
            maxWidth: "92vw",
            maxHeight: "82vh",
            objectFit: "contain",
          }}
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23374151' width='400' height='300'/%3E%3Ctext fill='%23aaa' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E";
          }}
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── MINI MAP ───────────────────────────────────────────────────────────────
function MiniMap({ lat, lng }) {
  if (!lat || !lng) return null;
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        height: 140,
        border: `1px solid ${T.border}`,
      }}
    >
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap
          center={{ lat, lng }}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: "cooperative",
          }}
        >
          <Marker position={{ lat, lng }} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

// ── STATUS BADGE ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Assigned;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.color,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}

// ── INCIDENT IMAGE STRIP ───────────────────────────────────────────────────
function IncidentImages({ incidents, onImageClick }) {
  const images = incidents?.filter((i) => i.image_url) || [];
  if (!images.length) return null;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.muted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 8,
        }}
      >
        Incident Photos ({images.length})
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        {images.map((inc, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick(normalizeImageUrl(inc.image_url))}
            style={{
              flexShrink: 0,
              width: 100,
              height: 72,
              borderRadius: 10,
              overflow: "hidden",
              border: `2px solid ${T.border}`,
              cursor: "pointer",
              position: "relative",
              transition: "transform 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.borderColor = T.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <img
              src={normalizeImageUrl(inc.image_url)}
              alt={`Incident ${idx + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div
              style={{
                display: "none",
                position: "absolute",
                inset: 0,
                background: "#374151",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              📷
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)",
                display: "flex",
                alignItems: "flex-end",
                padding: "4px 6px",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "#fff",
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                🔍 View
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TASK ROW (List Item) ────────────────────────────────────────────────────
function TaskRow({ task, index, onView, onImageClick }) {
  const [expanded, setExpanded] = useState(false);

  // Extract lat/lng from first incident
  const firstIncident = task.incidents?.[0];
  const coords = firstIncident?.location?.coordinates;
  const lng = coords?.[0];
  const lat = coords?.[1];

  const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;

  const detectedObjects =
    task.incidents?.flatMap((i) => i.detected_objects || []) || [];
  const uniqueObjects = [...new Set(detectedObjects)];

  return (
    <div
      style={{
        background: T.card,
        border: `1.5px solid ${T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(15,76,138,0.05)",
        animation: `fadeUp 0.3s ease ${index * 0.06}s both`,
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,76,138,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(15,76,138,0.05)";
      }}
    >
      {/* Left accent bar */}
      <div style={{ display: "flex" }}>
        <div
          style={{
            width: 4,
            background: task.priority ? pc.bar : T.primaryLight,
            flexShrink: 0,
          }}
        />

        <div
          style={{
            flex: 1,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* ── ROW 1: Header ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: T.muted,
                    background: T.faint,
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  {task.event_id || `#${task._id?.slice(-6)}`}
                </span>
                <StatusBadge status={task.status} />
                {task.priority && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: pc.color,
                      background: pc.bg,
                      borderRadius: 8,
                      padding: "2px 8px",
                    }}
                  >
                    {task.priority}
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.text,
                  lineHeight: 1.3,
                }}
              >
                {firstIncident?.incident_type || task.description || "Incident"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexShrink: 0,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: expanded ? T.faint : "#fff",
                  color: T.primary,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 9,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {expanded ? "▲ Less" : "▼ More"}
              </button>
              <button
                onClick={() => onView(task)}
                style={{
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Details →
              </button>
            </div>
          </div>

          {/* ── ROW 2: Meta pills ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {firstIncident?.timestamp && (
              <span
                style={{
                  fontSize: 11,
                  color: T.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🕐 {timeAgo(firstIncident.timestamp)}
              </span>
            )}
            {task.assignment_time && (
              <span
                style={{
                  fontSize: 11,
                  color: T.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                📋 Assigned {timeAgo(task.assignment_time)}
              </span>
            )}
            {task.incidents?.length > 0 && (
              <span style={{ fontSize: 11, color: T.muted }}>
                📁 {task.incidents.length} incident
                {task.incidents.length > 1 ? "s" : ""}
              </span>
            )}
            {uniqueObjects.length > 0 &&
              uniqueObjects.map((obj, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#7c3aed",
                    background: "#ede9fe",
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  {obj}
                </span>
              ))}
          </div>

          {/* ── Incident Images (always visible) ── */}
          <IncidentImages
            incidents={task.incidents}
            onImageClick={onImageClick}
          />

          {/* ── EXPANDED SECTION ── */}
          {expanded && (
            <div
              style={{
                borderTop: `1px solid ${T.border}`,
                paddingTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "fadeUp 0.2s ease both",
              }}
            >
              {/* Incidents detail */}
              {task.incidents?.map((inc, iIdx) => (
                <div
                  key={iIdx}
                  style={{
                    background: T.faint,
                    borderRadius: 12,
                    padding: 14,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.primary,
                      }}
                    >
                      Incident #{iIdx + 1} · {inc.incident_id}
                    </span>
                    <span style={{ fontSize: 10, color: T.muted }}>
                      {formatDate(inc.timestamp)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {/* Map */}
                    {inc.location?.coordinates && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <MiniMap
                          lat={inc.location.coordinates[1]}
                          lng={inc.location.coordinates[0]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SKELETON ───────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 16,
        overflow: "hidden",
        border: `1.5px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ width: 4, background: T.border, flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {[40, 65, 30].map((w, i) => (
            <div
              key={i}
              style={{
                height: i === 1 ? 18 : 12,
                width: `${w}%`,
                borderRadius: 6,
                background:
                  "linear-gradient(90deg,#f1f5f9 25%,#e8eef5 50%,#f1f5f9 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
const GroundStaffDashboard = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [groundStaffName, setGroundStaffName] = useState("");
  const [groundStaffId, setGroundStaffId] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get groundstaff data from localStorage (set during login)
        const storedData = localStorage.getItem("groundstaffData");
        if (storedData) {
          const groundStaff = JSON.parse(storedData);
          setGroundStaffName(groundStaff.name || "Ground Staff");
          setGroundStaffId(groundStaff.id || "");
          setAgencyName(groundStaff.agencyName || "");
          setIsAuthenticated(true);
        } else {
          // If no stored data, redirect to login
          console.error("No groundstaff data found");
          navigate("/groundstafflogin");
          return;
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate("/groundstafflogin");
        return;
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchTasks = useCallback(async () => {
    if (!agencyId || !groundStaffId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`backend/groundstaff/tasks/${agencyId}`, {
        headers: {
          "x-groundstaff-id": groundStaffId,
        },
      });
      if (res.status === 200) {
        const all = res.data.data || [];
        setAllTasks(all);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks.");
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, groundStaffId]);

  useEffect(() => {
    if (groundStaffId || groundStaffName) fetchTasks();
  }, [groundStaffId, groundStaffName, fetchTasks]);

  if (authLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await api.post("backend/groundstaff/logout");
      // Clear non-auth localStorage items
      localStorage.removeItem("selectedTask");
      localStorage.removeItem("groundstaffLoginAttempts");
      localStorage.removeItem("groundstaffLoginBlockedUntil");
      localStorage.removeItem("groundstaffData");
      navigate("/groundstafflogin");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      navigate("/groundstafflogin");
    }
  };

  const handleView = (task) => {
    localStorage.setItem("selectedTask", JSON.stringify(task));
    navigate(`/task-details/${task._id}`);
  };

  const counts = {
    All: allTasks.length,
    Assigned: allTasks.filter((t) => t.status === "Assigned").length,
    closed: allTasks.filter(
      (t) => t.status === "closed" || t.status === "Completed",
    ).length,
  };

  const filtered =
    filter === "All"
      ? allTasks
      : filter === "closed"
        ? allTasks.filter(
            (t) => t.status === "closed" || t.status === "Completed",
          )
        : allTasks.filter((t) => t.status === filter);

  const criticalActive = allTasks.filter(
    (t) => t.priority === "Critical" && t.status !== "closed",
  ).length;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const initials =
    groundStaffName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "GS";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-tap-highlight-color: transparent; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes lbIn     { from{opacity:0} to{opacity:1} }
        @keyframes lbScale  { from{transform:scale(0.92)} to{transform:scale(1)} }
        .hscroll            { display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px; }
        .hscroll::-webkit-scrollbar { display:none; }
        button              { -webkit-appearance:none; cursor:pointer; }
        .task-list          { display:flex; flex-direction:column; gap:12px; }
        .nav-name           { display:none; }
        @media(min-width:480px){ .nav-name { display:block; } }
      `}</style>

      {/* ── LIGHTBOX ── */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* ── NAV ── */}
      <nav
        style={{
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 16px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 200,
          boxShadow: "0 1px 12px rgba(15,76,138,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/images/omnivision-logo.png"
            alt="OmniVision Logo"
            style={{ height: 28, width: "auto" }}
          />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: T.text,
                lineHeight: 1.2,
              }}
            >
              OmniVision
            </div>
            <div
              style={{
                fontSize: 9,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Ground Staff
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div className="nav-name">
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                {groundStaffName}
              </div>
              <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>
                ● Online
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "#fff1f2",
              color: "#dc2626",
              border: "1.5px solid #fca5a5",
              borderRadius: 9,
              padding: "7px 13px",
              fontSize: 12,
              fontWeight: 700,
              minHeight: 36,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div
        style={{ maxWidth: 840, margin: "0 auto", padding: "16px 14px 80px" }}
      >
        {/* ── HERO CARD ── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, #1565c0 100%)`,
            borderRadius: 20,
            padding: "20px 18px",
            marginBottom: 14,
            color: "#fff",
            boxShadow: "0 8px 28px rgba(15,76,138,0.28)",
            animation: "fadeUp 0.3s ease both",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.7,
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {greeting}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                  lineHeight: 1.2,
                  marginBottom: 5,
                }}
              >
                {groundStaffName.split(" ")[0]} 👋
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.75,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <span>Agency:</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    background: "rgba(255,255,255,0.15)",
                    padding: "1px 8px",
                    borderRadius: 6,
                  }}
                >
                  {agencyName}
                </span>
                {lastRefreshed && (
                  <span style={{ opacity: 0.55 }}>
                    · Updated {timeAgo(lastRefreshed)}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          </div>

          {/* Stat pills */}
          <div className="hscroll" style={{ marginTop: 16 }}>
            {[
              { l: "Total", v: counts.All, c: "rgba(255,255,255,0.95)" },
              { l: "Assigned", v: counts.Assigned, c: "#fde68a" },
              { l: "Done", v: counts.closed, c: "#6ee7b7" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: "rgba(255,255,255,0.14)",
                  borderRadius: 14,
                  padding: "10px 16px",
                  textAlign: "center",
                  flexShrink: 0,
                  minWidth: 72,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: s.c,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    opacity: 0.7,
                    marginTop: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CRITICAL ALERT ── */}
        {criticalActive > 0 && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
              {criticalActive} critical task{criticalActive > 1 ? "s" : ""}{" "}
              require immediate attention!
            </span>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span
              style={{
                fontSize: 12,
                color: "#dc2626",
                fontWeight: 600,
                flex: 1,
              }}
            >
              {error}
            </span>
            <button
              onClick={fetchTasks}
              style={{
                fontSize: 11,
                color: "#dc2626",
                fontWeight: 700,
                background: "none",
                border: "1px solid #fca5a5",
                borderRadius: 6,
                padding: "4px 10px",
                minHeight: 30,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── FILTER BAR ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div className="hscroll" style={{ flex: 1 }}>
            {[
              { key: "All", label: "All" },
              { key: "Assigned", label: "Assigned" },
              { key: "closed", label: "Completed" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  background: filter === key ? T.primary : "#fff",
                  color: filter === key ? "#fff" : T.muted,
                  border: `1.5px solid ${filter === key ? T.primary : T.border}`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: filter === key ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  minHeight: 38,
                }}
              >
                {label}
                <span
                  style={{
                    background:
                      filter === key ? "rgba(255,255,255,0.2)" : T.faint,
                    borderRadius: 8,
                    padding: "0 6px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: filter === key ? "#fff" : T.muted,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={fetchTasks}
            disabled={loading}
            style={{
              background: "#fff",
              color: T.primary,
              border: `1.5px solid ${T.border}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 16,
              flexShrink: 0,
              opacity: loading ? 0.5 : 1,
              minHeight: 38,
            }}
          >
            <span
              style={
                loading
                  ? {
                      animation: "spin 1s linear infinite",
                      display: "inline-block",
                    }
                  : {}
              }
            >
              🔄
            </span>
          </button>
        </div>

        {/* ── TASK LIST ── */}
        {loading ? (
          <div className="task-list">
            {[...Array(3)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="task-list">
            {filtered.map((task, i) => (
              <TaskRow
                key={task._id || i}
                task={task}
                index={i}
                onView={handleView}
                onImageClick={setLightboxSrc}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: T.card,
              borderRadius: 16,
              padding: "50px 20px",
              textAlign: "center",
              border: `1.5px solid ${T.border}`,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>
              {allTasks.length === 0 ? "📭" : "🔍"}
            </div>
            <div
              style={{
                color: T.text,
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              {allTasks.length === 0
                ? "No tasks assigned yet"
                : `No ${filter} tasks`}
            </div>
            <div style={{ color: T.muted, fontSize: 13 }}>
              {allTasks.length === 0
                ? "Your agency will assign incidents here."
                : "Try a different filter."}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "env(safe-area-inset-bottom,0px)" }} />
      <div
        style={{
          textAlign: "center",
          padding: "12px 20px 24px",
          fontSize: 11,
          color: T.muted,
        }}
      >
        © 2026 OmniVision · All rights reserved by Neuradyne
      </div>
    </div>
  );
};

export default GroundStaffDashboard;
