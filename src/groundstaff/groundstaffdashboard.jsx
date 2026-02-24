import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";

// ─── THEME ────────────────────────────────────────────────────────────────────
const P = "#1f6fb2";
const P_LT = "#e8f2fb";
const P_MID = "#d0e6f7";

const STATUS_CFG = {
  Assigned: { color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  "In Progress": { color: "#1f6fb2", bg: "#e8f2fb", border: "#bfdbfe" },
  Completed: { color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
};

const PRIORITY_CFG = {
  Critical: { color: "#dc2626", bg: "#fee2e2" },
  High: { color: "#d97706", bg: "#fef3c7" },
  Medium: { color: "#1f6fb2", bg: "#e8f2fb" },
  Low: { color: "#059669", bg: "#d1fae5" },
};

const INCIDENT_ICONS = {
  "Road Accident": "🚗",
  "Fire Outbreak": "🔥",
  "Medical Emergency": "🚑",
  "Flood Alert": "🌊",
  Theft: "🔓",
  Violence: "⚠️",
};

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── MINI MAP ─────────────────────────────────────────────────────────────────
function MiniMap({ lat, lng }) {
  if (!lat || !lng) return null;
  const d = 0.012;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        height: 120,
        border: `1px solid ${P_MID}`,
        marginTop: 10,
      }}
    >
      <iframe
        title={`map-${lat}-${lng}`}
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
        loading="lazy"
      />
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Assigned;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onView }) {
  const [hov, setHov] = useState(false);
  const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
  const icon = INCIDENT_ICONS[task.incident_type] || "⚠️";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: `1.5px solid ${hov ? P : "#e8eef5"}`,
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: hov
          ? `0 8px 28px rgba(31,111,178,0.12)`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: `fadeUp 0.35s ease ${index * 0.06}s both`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: P_LT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
              {task.incident_type || "Incident"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontFamily: "monospace",
                marginTop: 1,
              }}
            >
              #{task.event_id || task._id}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          <StatusBadge status={task.status || "Assigned"} />
          {task.priority && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pc.color,
                background: pc.bg,
                borderRadius: 10,
                padding: "2px 8px",
              }}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {task.description}
        </p>
      )}

      {/* Map */}
      {(task.latitude || task.lat) && (task.longitude || task.lng) && (
        <MiniMap
          lat={task.latitude || task.lat}
          lng={task.longitude || task.lng}
        />
      )}

      {/* Location */}
      {task.location && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <span style={{ color: P, flexShrink: 0 }}>📍</span>
          <span style={{ lineHeight: 1.4 }}>{task.location}</span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          🕐 {task.timestamp ? timeAgo(task.timestamp) : "—"}
        </div>
        <button
          onClick={() => onView(task)}
          style={{
            background: hov ? P : P_LT,
            color: hov ? "#fff" : P,
            border: "none",
            borderRadius: 8,
            padding: "7px 16px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            transition: "all 0.2s ease",
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        border: "1.5px solid #e8eef5",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {[80, 120, 40, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 1 ? 120 : 16,
            width: `${w}%`,
            background:
              "linear-gradient(90deg, #f1f5f9 25%, #e8eef5 50%, #f1f5f9 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 8,
            animation: "shimmer 1.4s infinite",
          }}
        />
      ))}
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const GroundStaffDashboard = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [groundStaffName, setGroundStaffName] = useState("");
  const [groundStaffId, setGroundStaffId] = useState("");
  const [agencyIdState, setAgencyIdState] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // ── Auth check & init ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const aId = localStorage.getItem("agencyId");
    const name = localStorage.getItem("groundStaffName") || "Ground Staff";
    const staffId = localStorage.getItem("groundStaffId") || "";

    if (!token || !aId) {
      navigate("/groundstafflogin");
      return;
    }

    setGroundStaffName(name);
    setGroundStaffId(staffId);
    setAgencyIdState(aId);
  }, [navigate]);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedAId = localStorage.getItem("agencyId");
    const storedSId = localStorage.getItem("groundStaffId");
    const storedName = localStorage.getItem("groundStaffName") || "";

    if (!token || !storedAId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`backend/groundstaff/tasks/${storedAId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-groundstaff-id": storedSId,
        },
      });

      if (response.status === 200) {
        const all = response.data.data || [];

        // ── FILTER: only show tasks assigned to this ground staff ──────────
        // Matches by groundStaffId (_id) OR by name as fallback
        const myTasks = all.filter((task) => {
          const assignedId = task.ground_staff_id || task.groundStaffId || "";
          const assignedName =
            task.ground_staff_name ||
            task.ground_staff ||
            task.assigned_to ||
            "";

          const matchById = storedSId && assignedId === storedSId;
          const matchByName =
            storedName &&
            assignedName.toLowerCase().trim() ===
              storedName.toLowerCase().trim();

          return matchById || matchByName;
        });

        setAllTasks(myTasks);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("[fetchTasks] Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch tasks. Please try again.",
      );
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (groundStaffId || groundStaffName) fetchTasks();
  }, [groundStaffId, groundStaffName, fetchTasks]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    [
      "token",
      "groundStaffId",
      "groundStaffName",
      "agencyId",
      "mobileNumber",
      "groundstaffLoginAttempts",
      "groundstaffLoginBlockedUntil",
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/groundstafflogin");
  };

  // ── Task click ────────────────────────────────────────────────────────────
  const handleView = (task) => {
    localStorage.setItem("selectedTask", JSON.stringify(task));
    navigate(`/task-details/${task._id}`);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const counts = {
    All: allTasks.length,
    Assigned: allTasks.filter((t) => t.status === "Assigned").length,
    "In Progress": allTasks.filter((t) => t.status === "In Progress").length,
    Completed: allTasks.filter((t) => t.status === "Completed").length,
  };

  const filtered =
    filter === "All" ? allTasks : allTasks.filter((t) => t.status === filter);

  const criticalActive = allTasks.filter(
    (t) => t.priority === "Critical" && t.status !== "Completed",
  ).length;

  const initials =
    groundStaffName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "GS";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .task-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:18px; }
        @media(max-width:640px){.task-grid{grid-template-columns:1fr;} .hero-stats{display:none!important;}}
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8f0f8",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 8px rgba(31,111,178,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${P}, #2980c9)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
            }}
          >
            <img src="./logo.png" alt="Logo" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#111",
                letterSpacing: "-0.3px",
              }}
            >
              OmniVision
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Ground Staff Portal
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${P}, #2980c9)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                {groundStaffName}
              </div>
              <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>
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
              borderRadius: 8,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(130deg, ${P} 0%, #2980c9 100%)`,
            borderRadius: 20,
            padding: "24px 28px",
            marginBottom: 20,
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: `0 8px 32px rgba(31,111,178,0.22)`,
            animation: "fadeUp 0.35s ease both",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginBottom: 3,
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {greeting}
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: "0 0 4px",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome back, {groundStaffName.split(" ")[0]} 👋
            </h1>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Agency ID:&nbsp;
              <span
                style={{
                  fontFamily: "monospace",
                  background: "rgba(255,255,255,0.15)",
                  padding: "1px 8px",
                  borderRadius: 6,
                }}
              >
                {agencyIdState}
              </span>
              {lastRefreshed && (
                <span style={{ marginLeft: 10, opacity: 0.6 }}>
                  · Updated {timeAgo(lastRefreshed)}
                </span>
              )}
            </div>
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 12 }}>
            {[
              { l: "My Tasks", v: counts.All, c: "rgba(255,255,255,0.95)" },
              {
                l: "Active",
                v: counts.Assigned + counts["In Progress"],
                c: "#fde68a",
              },
              { l: "Done", v: counts.Completed, c: "#a7f3d0" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 14,
                  padding: "12px 18px",
                  textAlign: "center",
                  minWidth: 70,
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: s.c,
                    letterSpacing: "-1px",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.75,
                    marginTop: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alert */}
        {criticalActive > 0 && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "10px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 18 }}>🚨</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
              {criticalActive} critical incident{criticalActive > 1 ? "s" : ""}{" "}
              assigned to you — respond immediately
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <span>⚠️</span>
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              {error}
            </span>
            <button
              onClick={fetchTasks}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#dc2626",
                fontWeight: 700,
                background: "none",
                border: "1px solid #fca5a5",
                borderRadius: 6,
                padding: "3px 10px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs + Refresh */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {Object.entries(counts).map(([label, count]) => (
            <button
              key={label}
              onClick={() => setFilter(label)}
              style={{
                background: filter === label ? P : "#fff",
                color: filter === label ? "#fff" : "#64748b",
                border: `1.5px solid ${filter === label ? P : "#e5eaf0"}`,
                borderRadius: 10,
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: filter === label ? 700 : 500,
                transition: "all 0.18s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {label}
              <span
                style={{
                  background:
                    filter === label ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  borderRadius: 8,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: filter === label ? "#fff" : "#94a3b8",
                }}
              >
                {count}
              </span>
            </button>
          ))}

          <button
            onClick={fetchTasks}
            disabled={loading}
            style={{
              marginLeft: "auto",
              background: "#fff",
              color: P,
              border: `1.5px solid ${P_MID}`,
              borderRadius: 10,
              padding: "7px 14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
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
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="task-grid">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="task-grid">
            {filtered.map((task, i) => (
              <TaskCard
                key={task._id || i}
                task={task}
                index={i}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "50px 20px",
              textAlign: "center",
              border: "1.5px solid #f1f5f9",
              animation: "fadeUp 0.35s ease both",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 10 }}>
              {allTasks.length === 0 ? "📭" : "🔍"}
            </div>
            <div
              style={{
                color: "#374151",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              {allTasks.length === 0
                ? "No tasks assigned to you yet"
                : `No ${filter} tasks`}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              {allTasks.length === 0
                ? "Your agency will assign incidents here. Check back soon!"
                : "Try selecting a different filter above."}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "24px 20px",
          fontSize: 12,
          color: "#94a3b8",
        }}
      >
        © 2026 OmniVision · All rights reserved by Neuradyne
      </div>
    </div>
  );
};

export default GroundStaffDashboard;
