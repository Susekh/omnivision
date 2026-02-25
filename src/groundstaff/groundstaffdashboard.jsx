import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const P = "#1f6fb2";
const P_LT = "#e8f2fb";
const P_MID = "#d0e6f7";

const STATUS_CFG = {
  Assigned: { color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  "In Progress": { color: "#1f6fb2", bg: "#e8f2fb", border: "#bfdbfe" },
  Completed: { color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
};

const PRIORITY_CFG = {
  Critical: { color: "#dc2626", bg: "#fee2e2", stripe: "#dc2626" },
  High: { color: "#d97706", bg: "#fef3c7", stripe: "#f59e0b" },
  Medium: { color: "#1f6fb2", bg: "#e8f2fb", stripe: P },
  Low: { color: "#059669", bg: "#d1fae5", stripe: "#10b981" },
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

function MiniMap({ lat, lng }) {
  if (!lat || !lng) return null;
  const d = 0.012;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        height: 130,
        border: `1px solid ${P_MID}`,
      }}
    >
      <iframe
        title={`m-${lat}`}
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
        loading="lazy"
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Assigned;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.color,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function TaskCard({ task, index, onView }) {
  const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
  const icon = INCIDENT_ICONS[task.incident_type] || "⚠️";
  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e8eef5",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        animation: `fadeUp 0.35s ease ${index * 0.07}s both`,
      }}
    >
      {/* Priority stripe */}
      <div style={{ height: 4, background: pc.stripe, flexShrink: 0 }} />

      <div
        style={{
          padding: 15,
          display: "flex",
          flexDirection: "column",
          gap: 11,
          flex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: P_LT,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#111",
                  lineHeight: 1.3,
                }}
              >
                {task.incident_type || "Incident"}
              </div>
              <div
                style={{
                  fontSize: 10,
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
              gap: 4,
              flexShrink: 0,
            }}
          >
            <StatusBadge status={task.status || "Assigned"} />
            {task.priority && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: pc.color,
                  background: pc.bg,
                  borderRadius: 8,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
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
              lineHeight: 1.5,
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
              gap: 5,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            <span style={{ color: P, flexShrink: 0, marginTop: 1 }}>📍</span>
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
            marginTop: "auto",
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            🕐 {task.timestamp ? timeAgo(task.timestamp) : "—"}
          </span>
          <button
            onClick={() => onView(task)}
            style={{
              background: P,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              minHeight: 40,
            }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1.5px solid #e8eef5",
      }}
    >
      <div style={{ height: 4, background: "#e8eef5" }} />
      <div
        style={{
          padding: 15,
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        {[70, 50, 100, 40].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 2 ? 130 : 14,
              width: `${w}%`,
              borderRadius: 8,
              background:
                "linear-gradient(90deg,#f1f5f9 25%,#e8eef5 50%,#f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
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

  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedAId = localStorage.getItem("agencyId");
    const storedSId = localStorage.getItem("groundStaffId");
    const storedName = localStorage.getItem("groundStaffName") || "";
    if (!token || !storedAId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`backend/groundstaff/tasks/${storedAId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-groundstaff-id": storedSId,
        },
      });
      console.log("events for gr staff", res.data);
      
      if (res.status === 200) {
        const all = res.data.data || [];
        // Filter: only this staff member's tasks
        const mine = all.filter((t) => {
          const aId = t.ground_staff_id || t.groundStaffId || "";
          const aName =
            t.ground_staff_name || t.ground_staff || t.assigned_to || "";
          return (
            (storedSId && aId === storedSId) ||
            (storedName &&
              aName.toLowerCase().trim() === storedName.toLowerCase().trim())
          );
        });
        setAllTasks(mine);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks.");
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (groundStaffId || groundStaffName) fetchTasks();
  }, [groundStaffId, groundStaffName, fetchTasks]);

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

  const handleView = (task) => {
    localStorage.setItem("selectedTask", JSON.stringify(task));
    navigate(`/task-details/${task._id}`);
  };

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fc",
        fontFamily: "'Nunito','Segoe UI',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { -webkit-tap-highlight-color:transparent; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

        /* Grid: single col mobile, 2 col tablet+ */
        .tgrid { display:grid; grid-template-columns:1fr; gap:13px; }
        @media(min-width:600px){ .tgrid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

        /* Horizontal scroll rows */
        .hscroll {
          display:flex; gap:8px;
          overflow-x:auto; -webkit-overflow-scrolling:touch;
          scrollbar-width:none; padding-bottom:2px;
        }
        .hscroll::-webkit-scrollbar { display:none; }

        /* Tap targets */
        button { -webkit-appearance:none; cursor:pointer; }
        .tap   { min-height:44px; }

        /* Staff name in nav — show only on wide screens */
        .nav-name { display:none; }
        @media(min-width:480px){ .nav-name { display:block; } }
      `}</style>

      {/* ── NAV ── */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8f0f8",
          padding: "0 14px",
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 8px rgba(31,111,178,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            <img src="/images/omnivision-logo.png" alt="OmniVision Logo" />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#111",
                lineHeight: 1.2,
              }}
            >
              OmniVision
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Ground Staff
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                background: `linear-gradient(135deg,${P},#2980c9)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {initials}
            </div>
            <div className="nav-name" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>
                {groundStaffName}
              </div>
              <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>
                ● Online
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="tap"
            style={{
              background: "#fff1f2",
              color: "#dc2626",
              border: "1.5px solid #fca5a5",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "14px 12px 80px" }}
      >
        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(130deg,${P} 0%,#2980c9 100%)`,
            borderRadius: 18,
            padding: "18px 16px",
            marginBottom: 12,
            color: "#fff",
            boxShadow: `0 6px 24px rgba(31,111,178,0.22)`,
            animation: "fadeUp 0.35s ease both",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.75,
                  marginBottom: 2,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {greeting}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                Welcome, {groundStaffName.split(" ")[0]} 👋
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <span>Agency:</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    background: "rgba(255,255,255,0.15)",
                    padding: "1px 7px",
                    borderRadius: 5,
                  }}
                >
                  {agencyIdState}
                </span>
                {lastRefreshed && (
                  <span style={{ opacity: 0.6 }}>
                    · {timeAgo(lastRefreshed)}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {initials}
            </div>
          </div>

          {/* Scrollable stat pills */}
          <div className="hscroll" style={{ marginTop: 14 }}>
            {[
              { l: "Total", v: counts.All, c: "rgba(255,255,255,.95)" },
              { l: "Assigned", v: counts.Assigned, c: "#fde68a" },
              { l: "Active", v: counts["In Progress"], c: "#7dd3fc" },
              { l: "Done", v: counts.Completed, c: "#a7f3d0" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "9px 14px",
                  textAlign: "center",
                  flexShrink: 0,
                  minWidth: 68,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
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
                    opacity: 0.75,
                    marginTop: 1,
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

        {/* Critical alert */}
        {criticalActive > 0 && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "10px 13px",
              marginBottom: 11,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚨</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#dc2626",
                lineHeight: 1.4,
              }}
            >
              {criticalActive} critical task{criticalActive > 1 ? "s" : ""} —
              respond immediately!
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
              padding: "10px 13px",
              marginBottom: 11,
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
                minHeight: 32,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter tabs + refresh */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div className="hscroll" style={{ flex: 1 }}>
            {[
              { key: "All", label: "All" },
              { key: "Assigned", label: "Assigned" },
              { key: "In Progress", label: "In Progress" },
              { key: "Completed", label: "Completed" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="tap"
                style={{
                  background: filter === key ? P : "#fff",
                  color: filter === key ? "#fff" : "#64748b",
                  border: `1.5px solid ${filter === key ? P : "#e5eaf0"}`,
                  borderRadius: 10,
                  padding: "7px 11px",
                  fontSize: 12,
                  fontWeight: filter === key ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                {label}
                <span
                  style={{
                    background:
                      filter === key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    borderRadius: 8,
                    padding: "0 6px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: filter === key ? "#fff" : "#94a3b8",
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
            className="tap"
            style={{
              background: "#fff",
              color: P,
              border: `1.5px solid ${P_MID}`,
              borderRadius: 10,
              padding: "7px 11px",
              fontSize: 16,
              flexShrink: 0,
              opacity: loading ? 0.5 : 1,
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

        {/* Grid */}
        {loading ? (
          <div className="tgrid">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="tgrid">
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
              padding: "44px 20px",
              textAlign: "center",
              border: "1.5px solid #f1f5f9",
              animation: "fadeUp 0.35s ease both",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 10 }}>
              {allTasks.length === 0 ? "📭" : "🔍"}
            </div>
            <div
              style={{
                color: "#374151",
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              {allTasks.length === 0
                ? "No tasks assigned to you yet"
                : `No ${filter} tasks`}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
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
          color: "#94a3b8",
        }}
      >
        © 2026 OmniVision · All rights reserved by Neuradyne
      </div>
    </div>
  );
};

export default GroundStaffDashboard;
