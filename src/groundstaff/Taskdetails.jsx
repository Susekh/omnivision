import React, { useState, useEffect, useRef } from "react";
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
        padding: "4px 11px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.color,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

// ─── Info row (label + value card) ───────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "13px 14px",
        border: "1.5px solid #f1f5f9",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#94a3b8",
          fontWeight: 700,
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
          lineHeight: 1.45,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Full Map ─────────────────────────────────────────────────────────────────
function FullMap({ lat, lng, location }) {
  if (!lat || !lng) return null;
  const d = 0.02;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 14,
        border: `1.5px solid ${P_MID}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 9,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        📍 Incident Location on Map
      </div>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          height: 200,
          border: `1px solid ${P_MID}`,
        }}
      >
        <iframe
          title="map"
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          loading="lazy"
        />
      </div>
      {location && (
        <div
          style={{
            marginTop: 9,
            fontSize: 12,
            color: "#64748b",
            display: "flex",
            gap: 5,
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: P, flexShrink: 0 }}>📍</span>
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

// ─── Completion Form ──────────────────────────────────────────────────────────
function CompleteForm({ onSubmit, onCancel, submitting }) {
  const [remark, setRemark] = useState("");
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef();

  const addFiles = (files) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...imgs]);
    setPreviews((prev) => [
      ...prev,
      ...imgs.map((f) => URL.createObjectURL(f)),
    ]);
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
      alert("Please upload at least one photo.");
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
        padding: 16,
        animation: "fadeUp 0.3s ease both",
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 16,
          paddingBottom: 14,
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
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
            Task Completion Report
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            Upload photos & add remarks
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 7,
          }}
        >
          Completion Photos <span style={{ color: "#dc2626" }}>*</span>
          <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 5 }}>
            (at least 1)
          </span>
        </label>

        {/* Drop zone */}
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
            addFiles(Array.from(e.dataTransfer.files));
          }}
          style={{
            border: `2px dashed ${P_MID}`,
            borderRadius: 12,
            padding: "20px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: P_LT,
            touchAction: "manipulation",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 5 }}>📷</div>
          <div style={{ fontSize: 13, color: P, fontWeight: 700 }}>
            Tap to upload photos
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            JPG, PNG — multiple allowed
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(Array.from(e.target.files))}
            style={{ display: "none" }}
            capture="environment" /* opens camera directly on mobile */
          />
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div
            style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
          >
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt=""
                  style={{
                    width: 68,
                    height: 68,
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
                    top: -5,
                    right: -5,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Add more */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 68,
                height: 68,
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
              <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
                More
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Remark textarea */}
      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 7,
          }}
        >
          Completion Remarks <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Describe actions taken, current situation, handover details…"
          rows={4}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1.5px solid #e5eaf0",
            padding: "12px 13px",
            fontSize: 13,
            color: "#111",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.6,
            outline: "none",
            /* prevent iOS zoom on focus (font-size must be >= 16px in the field) */
            fontSize: "16px",
          }}
          onFocus={(e) => (e.target.style.borderColor = P)}
          onBlur={(e) => (e.target.style.borderColor = "#e5eaf0")}
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 3 }}
        >
          <span
            style={{
              fontSize: 10,
              color: remark.length > 20 ? "#10b981" : "#94a3b8",
            }}
          >
            {remark.length} chars
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: submitting
              ? "#6ee7b7"
              : "linear-gradient(135deg,#059669,#10b981)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(5,150,105,0.25)",
            minHeight: 50,
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
        <button
          onClick={onCancel}
          disabled={submitting}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1.5px solid #e5eaf0",
            background: "#fff",
            color: "#64748b",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            minHeight: 46,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Load task ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem("selectedTask");
    if (cached) {
      try {
        const p = JSON.parse(cached);
        if (!taskId || p._id === taskId) {
          setTask(p);
          setStatus(p.status || "Assigned");
          setLoading(false);
          return;
        }
      } catch (_) {}
    }
    fetchFromApi();
    // eslint-disable-next-line
  }, [taskId]);

  const fetchFromApi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get(`backend/groundstaff/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const t = res.data.data || res.data;
      setTask(t);
      setStatus(t.status || "Assigned");
    } catch {
      setError("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  // ── Accept → In Progress ───────────────────────────────────────────────────
  const handleAccept = async () => {
    try {
      setActLoading(true);
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
        err.response?.data?.message || "Failed to accept task. Try again.",
      );
    } finally {
      setActLoading(false);
    }
  };

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = async ({ remark, photos }) => {
    try {
      setActLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("status", "Completed");
      formData.append("remark", remark);
      photos.forEach((p) => formData.append("photos", p));

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
      setSuccessMsg("Task marked as completed! Report submitted.");
      localStorage.removeItem("selectedTask");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to complete task. Try again.",
      );
    } finally {
      setActLoading(false);
    }
  };

  const pc = PRIORITY_CFG[task?.priority] || PRIORITY_CFG.Medium;
  const lat = task?.latitude || task?.lat || null;
  const lng = task?.longitude || task?.lng || null;

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
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        textarea,input { font-size:16px!important; } /* prevent iOS auto-zoom */
        button { -webkit-appearance:none; cursor:pointer; }

        /* Info grid: 1 col on mobile, 2 col on wider */
        .info-grid { display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:480px){ .info-grid{ grid-template-columns:repeat(2,1fr); } }
      `}</style>

      {/* ── STICKY NAV ── */}
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
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: P_LT,
              color: P,
              border: "none",
              borderRadius: 8,
              padding: "7px 13px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              minHeight: 40,
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              width: 1,
              height: 22,
              background: "#e8eef5",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#111",
                lineHeight: 1.2,
              }}
            >
              Incident Details
            </div>
            {task && (
              <div
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                #{task.event_id || task._id}
              </div>
            )}
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </nav>

      {/* ── PAGE CONTENT ── */}
      <div
        style={{ maxWidth: 680, margin: "0 auto", padding: "14px 12px 80px" }}
      >
        {/* Spinner */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: 38,
                height: 38,
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

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1.5px solid #fca5a5",
              borderRadius: 12,
              padding: "11px 13px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
              {error}
            </span>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div
            style={{
              background: "#d1fae5",
              border: "1.5px solid #a7f3d0",
              borderRadius: 12,
              padding: "11px 13px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <span style={{ flexShrink: 0 }}>✅</span>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              {successMsg}
            </span>
          </div>
        )}

        {!loading && task && (
          <>
            {/* ── HEADER CARD ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                border: `1.5px solid ${P_MID}`,
                boxShadow: "0 4px 20px rgba(31,111,178,0.08)",
                marginBottom: 12,
                animation: "fadeUp 0.35s ease both",
              }}
            >
              {/* Priority stripe */}
              <div style={{ height: 4, background: pc.stripe }} />

              <div style={{ padding: 16 }}>
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: P_LT,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {INCIDENT_ICONS[task.incident_type] || "⚠️"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: "#111",
                          lineHeight: 1.2,
                        }}
                      >
                        {task.incident_type || "Incident"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          fontFamily: "monospace",
                          marginTop: 2,
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
                      gap: 5,
                      alignItems: "flex-end",
                      flexShrink: 0,
                    }}
                  >
                    <StatusBadge status={status} />
                    {task.priority && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: pc.color,
                          background: pc.bg,
                          borderRadius: 8,
                          padding: "2px 9px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.priority} Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.65,
                      margin: 0,
                      padding: 12,
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* ── INFO GRID ── */}
            <div
              className="info-grid"
              style={{
                marginBottom: 12,
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

            {/* ── MAP ── */}
            {lat && lng && (
              <div
                style={{
                  marginBottom: 12,
                  animation: "fadeUp 0.35s ease 0.1s both",
                }}
              >
                <FullMap lat={lat} lng={lng} location={task.location} />
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                border: `1.5px solid ${P_MID}`,
                boxShadow: "0 2px 8px rgba(31,111,178,0.06)",
                animation: "fadeUp 0.35s ease 0.15s both",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                ⚡ Actions
              </div>

              {/* ASSIGNED → Accept button */}
              {status === "Assigned" && !showComplete && (
                <button
                  onClick={handleAccept}
                  disabled={actLoading}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 12,
                    border: "none",
                    background: actLoading
                      ? P_MID
                      : `linear-gradient(135deg,${P},#2980c9)`,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: actLoading ? "not-allowed" : "pointer",
                    boxShadow: `0 4px 16px rgba(31,111,178,0.28)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 54,
                  }}
                >
                  {actLoading ? (
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

              {/* IN PROGRESS → Complete button */}
              {status === "In Progress" && !showComplete && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      background: P_LT,
                      borderRadius: 10,
                      padding: "10px 13px",
                      fontSize: 13,
                      color: P,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    🔵 You are currently responding to this incident
                  </div>
                  <button
                    onClick={() => setShowComplete(true)}
                    style={{
                      width: "100%",
                      padding: 16,
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#059669,#10b981)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      minHeight: 54,
                    }}
                  >
                    ✓ Mark as Completed
                  </button>
                </div>
              )}

              {/* Completion form */}
              {showComplete && (
                <CompleteForm
                  onSubmit={handleComplete}
                  onCancel={() => setShowComplete(false)}
                  submitting={actLoading}
                />
              )}

              {/* COMPLETED banner */}
              {status === "Completed" && (
                <div
                  style={{
                    background: "linear-gradient(135deg,#d1fae5,#ecfdf5)",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: 14,
                    padding: "24px 16px",
                    textAlign: "center",
                    animation: "fadeUp 0.4s ease both",
                  }}
                >
                  <div style={{ fontSize: 38, marginBottom: 8 }}>🎉</div>
                  <div
                    style={{ fontWeight: 800, fontSize: 17, color: "#059669" }}
                  >
                    Task Completed!
                  </div>
                  <div style={{ fontSize: 13, color: "#6ee7b7", marginTop: 4 }}>
                    Report has been submitted to the agency.
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      marginTop: 14,
                      background: "#fff",
                      color: "#059669",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: 44,
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

export default TaskDetails;
