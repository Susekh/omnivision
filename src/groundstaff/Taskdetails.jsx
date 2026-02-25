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

// ─────────────────────────────────────────────────────────────────────────────
const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── New completion flow state ──────────────────────────────────────────────
  const fileInputRef = useRef();
  const [pendingPhoto, setPendingPhoto] = useState(null); // base64
  const [showMsgPrompt, setShowMsgPrompt] = useState(false);
  const [completionMsg, setCompletionMsg] = useState("");

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

  // ── Compress image to base64 ───────────────────────────────────────────────
  const compressImage = (file, maxPx, quality) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = url;
    });

  // ── Step 1: open camera/gallery picker ────────────────────────────────────
  const handleOpenPicker = () => {
    fileInputRef.current.click();
  };

  // ── Step 2: file chosen → compress → show message prompt ──────────────────
  const handleFileChosen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be re-selected if needed
    e.target.value = "";
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setPendingPhoto(compressed);
      setShowMsgPrompt(true);
    } catch {
      setError("Failed to process image. Please try again.");
    }
  };

  // ── Step 3: submit photo + message → mark completed ───────────────────────
  const handleSubmitCompletion = async () => {
    if (!completionMsg.trim()) {
      setError("Please enter a message before submitting.");
      return;
    }
    try {
      setActLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await api.patch(
        `backend/groundstaff/task/${task._id}/complete`,
        {
          status: "Completed",
          remark: completionMsg,
          photo: pendingPhoto, // base64 string
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStatus("Completed");
      setTask((prev) => ({ ...prev, status: "Completed" }));
      setShowMsgPrompt(false);
      setPendingPhoto(null);
      setCompletionMsg("");
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

      {/* Hidden file input — no capture attr so OS shows Camera / Gallery sheet */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChosen}
      />

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

              {/* ASSIGNED or IN PROGRESS → Upload photo to complete */}
              {(status === "Assigned" || status === "In Progress") &&
                !showMsgPrompt && (
                  <button
                    onClick={handleOpenPicker}
                    disabled={actLoading}
                    style={{
                      width: "100%",
                      padding: 16,
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#059669,#10b981)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: actLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      minHeight: 54,
                    }}
                  >
                    📷 Upload Photo & Mark as Completed
                  </button>
                )}

              {/* Step 2: photo chosen → show preview + message input */}
              {showMsgPrompt && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    animation: "fadeUp 0.3s ease both",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      paddingBottom: 12,
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
                        Add a message and submit
                      </div>
                    </div>
                  </div>

                  {/* Photo preview */}
                  {pendingPhoto && (
                    <div style={{ position: "relative" }}>
                      <img
                        src={pendingPhoto}
                        alt="completion preview"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: `1.5px solid ${P_MID}`,
                          display: "block",
                        }}
                      />
                      {/* Retake overlay button */}
                      <button
                        onClick={handleOpenPicker}
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 11px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        🔄 Retake
                      </button>
                    </div>
                  )}

                  {/* Message textarea */}
                  <div>
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
                      value={completionMsg}
                      onChange={(e) => setCompletionMsg(e.target.value)}
                      placeholder="Describe actions taken, current situation, handover details…"
                      rows={4}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1.5px solid #e5eaf0",
                        padding: "12px 13px",
                        fontSize: 16,
                        color: "#111",
                        resize: "vertical",
                        fontFamily: "inherit",
                        lineHeight: 1.6,
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = P)}
                      onBlur={(e) => (e.target.style.borderColor = "#e5eaf0")}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: completionMsg.length > 20 ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {completionMsg.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitCompletion}
                    disabled={actLoading}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 12,
                      border: "none",
                      background: actLoading
                        ? "#6ee7b7"
                        : "linear-gradient(135deg,#059669,#10b981)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: actLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(5,150,105,0.25)",
                      minHeight: 50,
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
                        Submitting…
                      </>
                    ) : (
                      "✓ Submit & Mark Completed"
                    )}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => {
                      setShowMsgPrompt(false);
                      setPendingPhoto(null);
                      setCompletionMsg("");
                      setError("");
                    }}
                    disabled={actLoading}
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