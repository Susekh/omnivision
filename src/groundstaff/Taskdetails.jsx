import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1.5px solid #f1f5f9",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 600,
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#111",
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

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
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
function FullMap({ lat, lng, location }) {
  if (!lat || !lng) return null;
  const d = 0.02;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        border: `1.5px solid ${P_MID}`,
        boxShadow: "0 2px 8px rgba(31,111,178,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        📍 Incident Location
      </div>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          height: 220,
          border: `1px solid ${P_MID}`,
        }}
      >
        <iframe
          title="incident-map"
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          loading="lazy"
        />
      </div>
      {location && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#64748b",
            display: "flex",
            gap: 6,
          }}
        >
          <span style={{ color: P }}>📍</span>
          <span>{location}</span>
        </div>
      )}
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          marginTop: 8,
          fontSize: 12,
          color: P,
          fontWeight: 700,
        }}
      >
        Open in Google Maps →
      </a>
    </div>
  );
}

// ─── COMPLETION FORM ──────────────────────────────────────────────────────────
function CompleteForm({ onSubmit, onCancel, submitting }) {
  const [remark, setRemark] = useState("");
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (i) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!remark.trim()) {
      alert("Please enter a completion remark.");
      return;
    }
    if (photos.length < 1) {
      alert("Please upload at least one completion photo.");
      return;
    }
    onSubmit({ remark, photos });
  };

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${P_MID}`,
        borderRadius: 16,
        padding: 24,
        animation: "fadeUp 0.3s ease both",
      }}
    >
      {/* Section Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#d1fae5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
            Task Completion Report
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Upload photos and add remarks to close this incident
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Completion Photos <span style={{ color: "#dc2626" }}>*</span>
          <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>
            (minimum 1)
          </span>
        </label>

        <div
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = P;
          }}
          onDragLeave={(e) => (e.currentTarget.style.borderColor = P_MID)}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = P_MID;
            const files = Array.from(e.dataTransfer.files).filter((f) =>
              f.type.startsWith("image/"),
            );
            setPhotos(files);
            setPreviews(files.map((f) => URL.createObjectURL(f)));
          }}
          style={{
            border: `2px dashed ${P_MID}`,
            borderRadius: 12,
            padding: "24px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: P_LT,
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = P)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = P_MID)}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
          <div style={{ fontSize: 13, color: P, fontWeight: 700 }}>
            Click to upload or drag & drop
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            JPG, PNG, HEIC — multiple files allowed
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            style={{ display: "none" }}
          />
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div
            style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
          >
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt={`photo-${i}`}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: `2px solid ${P_MID}`,
                    display: "block",
                  }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                border: `2px dashed ${P_MID}`,
                background: P_LT,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
                color: P,
              }}
            >
              +
              <span style={{ fontSize: 9, marginTop: 2, color: "#94a3b8" }}>
                Add more
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Remark */}
      <div style={{ marginBottom: 22 }}>
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Completion Remarks <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Describe the actions taken, current situation at scene, handover details, any follow-up needed…"
          rows={5}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1.5px solid #e5eaf0",
            padding: "12px 14px",
            fontSize: 13,
            color: "#111",
            resize: "vertical",
            fontFamily: "inherit",
            outline: "none",
            lineHeight: 1.6,
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = P)}
          onBlur={(e) => (e.target.style.borderColor = "#e5eaf0")}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            Be as detailed as possible
          </span>
          <span
            style={{
              fontSize: 11,
              color: remark.length > 20 ? "#10b981" : "#94a3b8",
            }}
          >
            {remark.length} chars
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "1.5px solid #e5eaf0",
            background: "#fff",
            color: "#64748b",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            opacity: submitting ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 2,
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: submitting
              ? "#6ee7b7"
              : "linear-gradient(135deg, #059669, #10b981)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(5,150,105,0.25)",
            transition: "all 0.2s",
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              >
                ⟳
              </span>{" "}
              Submitting…
            </>
          ) : (
            "✓ Submit & Mark Completed"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Load task ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Try localStorage first (passed from dashboard)
    const cached = localStorage.getItem("selectedTask");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed._id === taskId || !taskId) {
          setTask(parsed);
          setStatus(parsed.status || "Assigned");
          setLoading(false);
          return;
        }
      } catch (_) {}
    }
    // Otherwise fetch from API
    fetchTaskFromApi();
    // eslint-disable-next-line
  }, [taskId]);

  const fetchTaskFromApi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get(`backend/groundstaff/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const t = res.data.data || res.data;
      setTask(t);
      setStatus(t.status || "Assigned");
    } catch (err) {
      setError("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  // ── Accept task → In Progress ──────────────────────────────────────────────
  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      await api.patch(
        `backend/groundstaff/task/${task._id}/status`,
        { status: "In Progress" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStatus("In Progress");
      setTask((prev) => ({ ...prev, status: "In Progress" }));
      setSuccessMsg("Task accepted! You are now responding.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to accept task. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── Complete task ──────────────────────────────────────────────────────────
  const handleComplete = async ({ remark, photos }) => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("status", "Completed");
      formData.append("remark", remark);
      photos.forEach((photo, i) => formData.append(`photos`, photo));

      await api.patch(
        `backend/groundstaff/task/${task._id}/complete`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setStatus("Completed");
      setTask((prev) => ({ ...prev, status: "Completed" }));
      setShowComplete(false);
      setSuccessMsg("Task marked as completed successfully!");
      // Clear cached task
      localStorage.removeItem("selectedTask");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to complete task. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const sc = STATUS_CFG[status] || STATUS_CFG.Assigned;
  const pc = PRIORITY_CFG[task?.priority] || PRIORITY_CFG.Medium;
  const lat = task?.latitude || task?.lat || null;
  const lng = task?.longitude || task?.lng || null;

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
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        textarea:focus, input:focus { outline: none; }
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
          <button
            onClick={() => navigate(-1)}
            style={{
              background: P_LT,
              color: P,
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              width: 1,
              height: 24,
              background: "#e8eef5",
              margin: "0 4px",
            }}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${P}, #2980c9)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>
              Incident Details
            </div>
            {task && (
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontFamily: "monospace",
                }}
              >
                #{task.event_id || task._id}
              </div>
            )}
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `3px solid ${P_MID}`,
                borderTopColor: P,
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Loading task details…
            </div>
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
            }}
          >
            <span>⚠️</span>
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              {error}
            </span>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div
            style={{
              background: "#d1fae5",
              border: "1.5px solid #a7f3d0",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <span>✅</span>
            <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>
              {successMsg}
            </span>
          </div>
        )}

        {!loading && task && (
          <>
            {/* ── Header Card ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                border: `1.5px solid ${P_MID}`,
                boxShadow: "0 4px 20px rgba(31,111,178,0.08)",
                marginBottom: 14,
                animation: "fadeUp 0.35s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: P_LT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    {INCIDENT_ICONS[task.incident_type] || "⚠️"}
                  </div>
                  <div>
                    <h1
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#111",
                        margin: "0 0 3px",
                      }}
                    >
                      {task.incident_type || "Incident"}
                    </h1>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontFamily: "monospace",
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
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  <StatusBadge status={status} />
                  {task.priority && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: pc.color,
                        background: pc.bg,
                        borderRadius: 10,
                        padding: "2px 10px",
                      }}
                    >
                      {task.priority} Priority
                    </span>
                  )}
                </div>
              </div>

              {task.description && (
                <p
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.7,
                    margin: 0,
                    padding: "14px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {task.description}
                </p>
              )}
            </div>

            {/* ── Info Grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 14,
                animation: "fadeUp 0.35s ease 0.05s both",
              }}
            >
              <InfoRow icon="📍" label="Location" value={task.location} />
              <InfoRow
                icon="🕐"
                label="Reported At"
                value={
                  task.timestamp
                    ? new Date(task.timestamp).toLocaleString("en-IN")
                    : null
                }
              />
              <InfoRow
                icon="👤"
                label="Assigned To"
                value={task.ground_staff || task.ground_staff_name}
              />
              <InfoRow icon="📞" label="Contact" value={task.contact} />
              <InfoRow icon="📡" label="Reported By" value={task.reporter} />
              <InfoRow icon="🏥" label="Casualties" value={task.casualties} />
            </div>

            {/* ── Map ── */}
            {lat && lng && (
              <div
                style={{
                  marginBottom: 14,
                  animation: "fadeUp 0.35s ease 0.1s both",
                }}
              >
                <FullMap lat={lat} lng={lng} location={task.location} />
              </div>
            )}

            {/* ── ACTION SECTION ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 20,
                border: `1.5px solid ${P_MID}`,
                boxShadow: "0 2px 8px rgba(31,111,178,0.06)",
                animation: "fadeUp 0.35s ease 0.15s both",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ⚡ Actions
              </div>

              {/* ASSIGNED → Accept */}
              {status === "Assigned" && !showComplete && (
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    background: actionLoading
                      ? P_MID
                      : `linear-gradient(135deg, ${P}, #2980c9)`,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    boxShadow: `0 4px 16px rgba(31,111,178,0.28)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {actionLoading ? (
                    <>
                      <span
                        style={{
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                        }}
                      >
                        ⟳
                      </span>{" "}
                      Accepting…
                    </>
                  ) : (
                    "✋ Accept Task — Start Responding"
                  )}
                </button>
              )}

              {/* IN PROGRESS → Complete */}
              {status === "In Progress" && !showComplete && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div
                    style={{
                      background: P_LT,
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: P,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    🔵 You have accepted this task and are currently responding
                  </div>
                  <button
                    onClick={() => setShowComplete(true)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.9")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    ✓ Mark as Completed
                  </button>
                </div>
              )}

              {/* Completion Form */}
              {showComplete && (
                <CompleteForm
                  onSubmit={handleComplete}
                  onCancel={() => setShowComplete(false)}
                  submitting={actionLoading}
                />
              )}

              {/* COMPLETED Banner */}
              {status === "Completed" && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: 14,
                    padding: "24px 20px",
                    textAlign: "center",
                    animation: "fadeUp 0.4s ease both",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                  <div
                    style={{ fontWeight: 800, fontSize: 17, color: "#059669" }}
                  >
                    Task Completed
                  </div>
                  <div style={{ fontSize: 13, color: "#6ee7b7", marginTop: 4 }}>
                    Your report has been submitted to the agency.
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      marginTop: 14,
                      background: "#fff",
                      color: "#059669",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "8px 20px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

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

export default TaskDetails;
