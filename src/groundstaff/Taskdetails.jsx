import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import normalizeImageUrl from "../utils/normalizeMinioImgUrl";

// ── THEME (matches dashboard) ──────────────────────────────────────────────
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
        padding: "4px 12px",
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
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}

// ── INFO CARD ──────────────────────────────────────────────────────────────
function InfoCard({ icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 12,
        padding: "12px 14px",
        border: `1.5px solid ${T.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: T.muted,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 5,
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: T.text,
          fontWeight: 600,
          lineHeight: 1.5,
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── FULL MAP ───────────────────────────────────────────────────────────────
function FullMap({ lat, lng }) {
  if (!lat || !lng) return null;
  const d = 0.02;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 16,
        padding: 14,
        border: `1.5px solid ${T.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.muted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 10,
        }}
      >
        📍 Incident Location
      </div>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          height: 210,
          border: `1px solid ${T.border}`,
        }}
      >
        <iframe
          title="map"
          src={src}
          style={{ width: "100%", height: "100%", border: "none" }}
          loading="lazy"
        />
      </div>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginTop: 10,
          fontSize: 12,
          color: T.primaryLight,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Open in Google Maps →
      </a>
    </div>
  );
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
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23374151' width='400' height='300'/%3E%3Ctext fill='%23aaa' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E";
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

// ── INCIDENT IMAGE STRIP ───────────────────────────────────────────────────
function IncidentImages({ incidents, onImageClick }) {
  const images = incidents?.filter((i) => i.image_url) || [];
  if (!images.length) return null;

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 16,
        padding: 14,
        border: `1.5px solid ${T.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.muted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 10,
        }}
      >
        📷 Incident Photos ({images.length})
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
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
              width: 140,
              height: 100,
              borderRadius: 12,
              overflow: "hidden",
              border: `2px solid ${T.border}`,
              cursor: "pointer",
              position: "relative",
              transition:
                "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.borderColor = T.primaryLight;
              e.currentTarget.style.boxShadow = `0 4px 16px ${T.primaryGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
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
                fontSize: 24,
              }}
            >
              📷
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
                display: "flex",
                alignItems: "flex-end",
                padding: "6px 8px",
              }}
            >
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>
                🔍 View
              </span>
            </div>
          </div>
        ))}
      </div>
      {images[0]?.incident_id && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>
          Incident ID:{" "}
          <span style={{ fontFamily: "monospace", color: T.text }}>
            {images[0].incident_id}
          </span>
        </div>
      )}
    </div>
  );
}

// ── COMPLETION CARD ────────────────────────────────────────────────────────
function CompletionCard({ completion, onImageClick }) {
  if (!completion) return null;
  const { remark, photo_url, completed_at } = completion;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
        border: "1.5px solid #a7f3d0",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(5,150,105,0.1)",
      }}
    >
      {/* Green top bar */}
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg, #059669, #10b981)",
        }}
      />

      <div style={{ padding: 18 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: "1px solid #bbf7d0",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #059669, #10b981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>
              Task Completed
            </div>
            {completed_at && (
              <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>
                {formatDate(completed_at)} · {timeAgo(completed_at)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Completion photo */}
          {normalizeImageUrl(photo_url) && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#059669",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                📷 Completion Photo
              </div>
              <div
                onClick={() => onImageClick(normalizeImageUrl(photo_url))}
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "2px solid #a7f3d0",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(5,150,105,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <img
                  src={normalizeImageUrl(photo_url)}
                  alt="Completion"
                  style={{
                    width: "100%",
                    maxHeight: 260,
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
                    height: 120,
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#d1fae5",
                    fontSize: 32,
                    color: "#10b981",
                  }}
                >
                  📷
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  🔍 View Full
                </div>
              </div>
            </div>
          )}

          {/* Remark */}
          {remark && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#059669",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                📝 Completion Remarks
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: "1px solid #bbf7d0",
                  fontSize: 13,
                  color: "#065f46",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                "{remark}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPickerSheet, setShowPickerSheet] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fileInputRef = useRef();
  const cameraInputRef = useRef();
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [showMsgPrompt, setShowMsgPrompt] = useState(false);
  const [completionMsg, setCompletionMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [showCamera, setShowCamera] = useState(false);

  // ── Load task ──────────────────────────────────────────────────────────
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

  // ── Compress image ─────────────────────────────────────────────────────
  const compressImage = (file, maxPx, quality) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = url;
    });

  const handleFileChosen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setPendingPhoto(compressed);
      setShowMsgPrompt(true);
    } catch {
      setError("Failed to process image. Please try again.");
    }
  };

  const handleSubmitCompletion = async () => {
    if (!completionMsg.trim()) {
      setError("Please enter a completion message before submitting.");
      return;
    }
    try {
      setActLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await api.patch(
        `backend/groundstaff/task/${task._id}/complete`,
        {
          status: "closed",
          remark: completionMsg,
          photo: pendingPhoto,
          groundStaffId: localStorage.getItem("groundStaffId"),
          agencyId: localStorage.getItem("agencyId"),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStatus("Completed");
      setTask((prev) => ({
        ...prev,
        status: "Completed",
        completion: {
          remark: completionMsg,
          photo_url: pendingPhoto, // base64 preview until page refresh
          completed_at: new Date().toISOString(),
          ground_staff_id: localStorage.getItem("groundStaffId"),
          agency_id: localStorage.getItem("agencyId"),
        },
      }));
      setShowMsgPrompt(false);
      setPendingPhoto(null);
      setCompletionMsg("");
      setSuccessMsg("Task marked as completed. Report submitted to agency.");
      localStorage.removeItem("selectedTask");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to complete task. Try again.",
      );
    } finally {
      setActLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setShowCamera(true);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/jpeg", 0.7);

    stopCamera();

    setPendingPhoto(base64);
    setShowMsgPrompt(true);
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const firstIncident = task?.incidents?.[0];
  console.log("Frist incident ::", firstIncident);
  const coords = firstIncident?.location?.coordinates;
  const lat = coords?.[1] || task?.latitude || task?.lat || null;
  const lng = coords?.[0] || task?.longitude || task?.lng || null;
  const pc = PRIORITY_CFG[task?.priority] || PRIORITY_CFG.Medium;
  const isActionable = status === "Assigned" || status === "Assigned";
  const isCompleted = status === "Completed" || status === "closed";
  const detectedObjects =
    task?.incidents?.flatMap((i) => i.detected_objects || []) || [];
  const uniqueObjects = [...new Set(detectedObjects)];

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
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes lbIn    { from{opacity:0} to{opacity:1} }
        @keyframes lbScale { from{transform:scale(0.92)} to{transform:scale(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        textarea, input    { font-size: 16px !important; }
        button             { -webkit-appearance: none; cursor: pointer; }
        .info-grid         { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media(min-width:480px) { .info-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChosen}
      />

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: T.faint,
              color: T.primary,
              border: "none",
              borderRadius: 9,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5,
              minHeight: 38,
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              width: 1,
              height: 22,
              background: T.border,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: T.text,
                lineHeight: 1.2,
              }}
            >
              Incident Details
            </div>
            {task && (
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.event_id || `#${task._id}`}
              </div>
            )}
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </nav>

      {/* ── PAGE ── */}
      <div
        style={{ maxWidth: 700, margin: "0 auto", padding: "16px 14px 80px" }}
      >
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `3px solid ${T.border}`,
                borderTopColor: T.primary,
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 14px",
              }}
            />
            <div style={{ color: T.muted, fontSize: 14 }}>
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
              padding: "11px 14px",
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
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                fontSize: 16,
                cursor: "pointer",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div
            style={{
              background: "#d1fae5",
              border: "1.5px solid #a7f3d0",
              borderRadius: 12,
              padding: "11px 14px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ── HEADER CARD ── */}
            <div
              style={{
                background: T.card,
                borderRadius: 16,
                overflow: "hidden",
                border: `1.5px solid ${T.border}`,
                boxShadow: "0 4px 20px rgba(15,76,138,0.07)",
                animation: "fadeUp 0.3s ease both",
              }}
            >
              <div
                style={{
                  height: 4,
                  background: task.priority ? pc.bar : T.primaryLight,
                }}
              />
              <div style={{ padding: 18 }}>
                {/* IDs + badges */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: T.muted,
                      background: T.faint,
                      borderRadius: 6,
                      padding: "2px 9px",
                    }}
                  >
                    {task.event_id || `#${task._id?.slice(-6)}`}
                  </span>
                  <StatusBadge status={status} />
                  {task.priority && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: pc.color,
                        background: pc.bg,
                        borderRadius: 8,
                        padding: "3px 9px",
                      }}
                    >
                      {task.priority} Priority
                    </span>
                  )}
                </div>

                {/* Incident type */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.text,
                    lineHeight: 1.2,
                    marginBottom: 8,
                  }}
                >
                  {firstIncident?.incident_type ||
                    task.description ||
                    "Incident"}
                </div>

                {/* Detected objects */}
                {uniqueObjects.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 5,
                    }}
                  >
                    {uniqueObjects.map((obj, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#7c3aed",
                          background: "#ede9fe",
                          borderRadius: 6,
                          padding: "2px 9px",
                        }}
                      >
                        🔍 {obj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── INCIDENT IMAGES ── */}
            <div style={{ animation: "fadeUp 0.3s ease 0.05s both" }}>
              <IncidentImages
                incidents={task.incidents}
                onImageClick={setLightboxSrc}
              />
            </div>

            {/* ── MAP ── */}
            {lat && lng && (
              <div style={{ animation: "fadeUp 0.3s ease 0.08s both" }}>
                <FullMap lat={lat} lng={lng} />
              </div>
            )}

            {/* ── INFO GRID ── */}
            <div
              className="info-grid"
              style={{ animation: "fadeUp 0.3s ease 0.1s both" }}
            >
              <InfoCard
                icon="🕐"
                label="Reported At"
                value={formatDate(firstIncident?.timestamp || task.timestamp)}
              />
              <InfoCard
                icon="📋"
                label="Assigned At"
                value={formatDate(task.assignment_time)}
              />
              <InfoCard icon="📍" label="Location" value={task.location} />
              <InfoCard icon="📞" label="Contact" value={task.contact} />
              <InfoCard icon="📡" label="Reported By" value={task.reporter} />
              <InfoCard icon="🏥" label="Casualties" value={task.casualties} />
            </div>

            {/* ── INCIDENTS DETAIL ── */}
            {task.incidents?.length > 0 && (
              <div
                style={{
                  background: T.card,
                  borderRadius: 16,
                  padding: 16,
                  border: `1.5px solid ${T.border}`,
                  animation: "fadeUp 0.3s ease 0.12s both",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 12,
                  }}
                >
                  📁 Incidents ({task.incidents.length})
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {task.incidents.map((inc, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: T.faint,
                        borderRadius: 12,
                        padding: 13,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: T.primary,
                            fontFamily: "monospace",
                          }}
                        >
                          {inc.incident_id || `Incident #${idx + 1}`}
                        </span>
                        {inc.timestamp && (
                          <span style={{ fontSize: 10, color: T.muted }}>
                            {timeAgo(inc.timestamp)}
                          </span>
                        )}
                      </div>
                      {inc.incident_type && (
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.text,
                            marginBottom: 6,
                          }}
                        >
                          {inc.incident_type}
                        </div>
                      )}
                      {inc.detected_objects?.length > 0 && (
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 5 }}
                        >
                          {inc.detected_objects.map((obj, oi) => (
                            <span
                              key={oi}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#7c3aed",
                                background: "#ede9fe",
                                borderRadius: 6,
                                padding: "2px 7px",
                              }}
                            >
                              {obj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div
              style={{
                background: T.card,
                borderRadius: 16,
                padding: 18,
                border: `1.5px solid ${T.border}`,
                boxShadow: "0 2px 10px rgba(15,76,138,0.05)",
                animation: "fadeUp 0.3s ease 0.16s both",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 14,
                }}
              >
                ⚡ Actions
              </div>

              {/* ── ACTIONABLE: upload + complete ── */}
              {isActionable && !showMsgPrompt && (
                <button
                  onClick={() => setShowPickerSheet(true)}
                  disabled={actLoading}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: actLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 18px rgba(5,150,105,0.25)",
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

              {/* ── COMPLETION FORM ── */}
              {showMsgPrompt && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    animation: "fadeUp 0.25s ease both",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      paddingBottom: 14,
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
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
                      <div
                        style={{ fontWeight: 700, fontSize: 14, color: T.text }}
                      >
                        Task Completion Report
                      </div>
                      <div
                        style={{ fontSize: 11, color: T.muted, marginTop: 2 }}
                      >
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
                          maxHeight: 240,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: `1.5px solid ${T.border}`,
                          display: "block",
                        }}
                      />
                      <button
                        onClick={() => setShowPickerSheet(true)}
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        🔄 Retake
                      </button>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.text,
                        marginBottom: 8,
                      }}
                    >
                      Completion Remarks{" "}
                      <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <textarea
                      value={completionMsg}
                      onChange={(e) => setCompletionMsg(e.target.value)}
                      placeholder="Describe actions taken, current situation, handover details…"
                      rows={4}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: `1.5px solid ${T.border}`,
                        padding: "12px 14px",
                        fontSize: 16,
                        color: T.text,
                        resize: "vertical",
                        fontFamily: "inherit",
                        lineHeight: 1.6,
                        outline: "none",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = T.primaryLight)
                      }
                      onBlur={(e) => (e.target.style.borderColor = T.border)}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            completionMsg.length > 20 ? "#10b981" : T.muted,
                        }}
                      >
                        {completionMsg.length} chars
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitCompletion}
                    disabled={actLoading}
                    style={{
                      width: "100%",
                      padding: 15,
                      borderRadius: 12,
                      border: "none",
                      background: actLoading
                        ? "#6ee7b7"
                        : "linear-gradient(135deg, #059669, #10b981)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: actLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
                      minHeight: 52,
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
                      padding: 13,
                      borderRadius: 12,
                      border: `1.5px solid ${T.border}`,
                      background: "#fff",
                      color: T.muted,
                      fontWeight: 600,
                      fontSize: 14,
                      minHeight: 46,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* ── COMPLETED STATE ── */}
              {isCompleted && !task.completion && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: 14,
                    padding: "28px 20px",
                    textAlign: "center",
                    animation: "fadeUp 0.35s ease both",
                  }}
                >
                  <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color: "#059669",
                      marginBottom: 5,
                    }}
                  >
                    Task Completed!
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#10b981", marginBottom: 18 }}
                  >
                    Report has been submitted to the agency.
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      background: "#fff",
                      color: "#059669",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "11px 26px",
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

              {/* ── COMPLETED WITH REPORT ── */}
              {isCompleted && task.completion && (
                <div style={{ animation: "fadeUp 0.35s ease both" }}>
                  <CompletionCard
                    completion={task.completion}
                    onImageClick={setLightboxSrc}
                  />
                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      width: "100%",
                      marginTop: 12,
                      background: "#fff",
                      color: "#059669",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "12px 26px",
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

              {/* ── NO ACTIONS STATE ── */}
              {!isActionable && !isCompleted && (
                <div
                  style={{
                    background: T.faint,
                    border: `1.5px dashed ${T.border}`,
                    borderRadius: 14,
                    padding: "28px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: T.text,
                      marginBottom: 6,
                    }}
                  >
                    No Actions Available
                  </div>
                  <div
                    style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}
                  >
                    This task is in <strong>{status}</strong> status. Actions
                    will be available once the task is assigned or in progress.
                  </div>
                </div>
              )}
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

      {/* ── BOTTOM SHEET ── */}
      {showPickerSheet && (
        <>
          <div
            onClick={() => setShowPickerSheet(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 300,
              animation: "lbIn 0.2s ease both",
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              padding: "20px 16px calc(20px + env(safe-area-inset-bottom))",
              zIndex: 301,
              animation: "fadeUp 0.25s ease both",
              boxShadow: "0 -6px 30px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 4,
                background: T.border,
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.muted,
                textAlign: "center",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Add Completion Photo
            </div>

            <button
              onClick={() => {
                setShowPickerSheet(false);
                startCamera();
              }}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                border: "none",
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 10,
                minHeight: 54,
              }}
            >
              📷 Take Photo
            </button>

            <button
              onClick={() => setShowPickerSheet(false)}
              style={{
                width: "100%",
                padding: 13,
                borderRadius: 14,
                border: `1.5px solid ${T.border}`,
                background: "#fff",
                color: T.muted,
                fontWeight: 600,
                fontSize: 15,
                minHeight: 48,
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {showCamera && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 9999,
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <button
              onClick={capturePhoto}
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "6px solid white",
                background: "transparent",
              }}
            />

            <button
              onClick={stopCamera}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
              }}
            >
              Cancel
            </button>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
