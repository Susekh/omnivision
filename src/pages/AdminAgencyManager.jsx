import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  Plus,
  Save,
  X,
  MapPin,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  Marker,
  Polygon,
  GoogleMap,
  LoadScript,
  InfoWindow,
  useGoogleMap,
} from "@react-google-maps/api";
import api from "../api";
import AdminAuth from "./AdminAuth";

// ── MapUpdater for Premium Smooth Panning & Bound Fitting ─────────────────────
const MapUpdater = ({ target }) => {
  const map = useGoogleMap();
  useEffect(() => {
    if (!target || !map) return;
    
    if (target.type === 'polygon' && target.paths && target.paths.length > 0) {
      // Create bounds strictly to the active polygon for optimal framing
      const bounds = new window.google.maps.LatLngBounds();
      target.paths.forEach(p => bounds.extend(p));
      map.fitBounds(bounds);
    } else if (target.type === 'point' && target.lat && target.lng) {
      // panTo triggers Google Map's built-in smooth scrolling animation
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(16);
    }
  }, [target, map]);
  return null;
};

// ── Shared Map Options & Premium Dark Styling ────────────────────────────────
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1e293b' }] }, // slate-800
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] }
  ]
};

const polygonOptions = {
  strokeColor: "#38bdf8", // sky-400 equivalent for neon accent
  strokeOpacity: 0.9,
  strokeWeight: 2,
  fillColor: "#0ea5e9", // sky-500
  fillOpacity: 0.25,
};

// ── Default form factory ─────────────────────────────────────────────────────
const defaultForm = () => ({
  AgencyName: "",
  mobileNumber: "",
  password: "",
  eventResponsibleFor: "",
  locationType: "location",
  latitude: "20.2961",
  longitude: "85.8245",
  jurisdictionPoints: [
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
  ],
});

// ── Component ─────────────────────────────────────────────────────────────────
const AdminAgencyManager = () => {
  const [agencies, setAgencies] = useState([]);
  const [view, setView] = useState("list");
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mapTarget, setMapTarget] = useState({ type: 'point', lat: 20.2961, lng: 85.8245 });
  const [activeInfo, setActiveInfo] = useState(null);
  const [fileUploadError, setFileUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState(defaultForm());
  const [modelLoading, setModelLoading] = useState(false);
  const [activeModel, setActiveModel] = useState("YOLO");

  // ── Resize listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Auth check on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("backend/admin/check-auth");
        if (res.status === 200) setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  // ── Fetch data once logged in ────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) {
      fetchAgencies();
      fetchActiveModel();
    }
  }, [isLoggedIn]);

  // ── Auto-dismiss notifications ───────────────────────────────────────────
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
    return () => clearTimeout(t);
  }, [error, success]);

  // ── API helpers ──────────────────────────────────────────────────────────
  const fetchAgencies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/backend/agencies");
      if (res.data.success) setAgencies(res.data.data);
      else setError("Failed to fetch agencies");
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching agencies");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveModel = async () => {
    try {
      const res = await api.get("/backend/active-model");
      if (res.data?.success) setActiveModel(res.data.activeModel);
    } catch {
      /* silent */
    }
  };

  const switchModel = async () => {
    try {
      setModelLoading(true);
      const nextModel = activeModel === "YOLO" ? "VLM" : "YOLO";
      const res = await api.post("/backend/switch-model", { model: nextModel });
      if (!res.data?.success)
        throw new Error(res.data?.message || "Failed to switch model");
      setActiveModel(res.data.activeModel);
    } catch (err) {
      console.error("Model switch failed:", err);
      alert("Failed to switch model");
    } finally {
      setModelLoading(false);
    }
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    try {
      await api.post("/backend/admin/logout");
    } catch {
      /* silent */
    }
    setIsLoggedIn(false);
  };

  // ── handleViewOnMap ──────────────────────────────────────────────────────
  // Triggers smooth pan to location or fitBounds to jurisdiction polygon
  const handleViewOnMap = (agency) => {
    if (agency.jurisdiction?.coordinates && agency.jurisdiction.coordinates.length > 0) {
      const paths = agency.jurisdiction.coordinates.map(c => ({ lat: parseFloat(c[0]), lng: parseFloat(c[1]) }));
      setMapTarget({ type: 'polygon', paths });
    } else if (agency.location?.latitude && agency.location?.longitude) {
      setMapTarget({ type: 'point', lat: parseFloat(agency.location.latitude), lng: parseFloat(agency.location.longitude) });
    }
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData(defaultForm());
    setEditMode(false);
    setView("form");
    setError("");
    setSuccess("");
  };

  const handleEdit = (agency) => {
    const hasJurisdiction =
      agency.jurisdiction && agency.jurisdiction.coordinates;

    let jurisdictionPoints = Array.from({ length: 5 }, () => ({
      lat: "",
      lng: "",
    }));
    if (hasJurisdiction && Array.isArray(agency.jurisdiction.coordinates)) {
      const parsed = agency.jurisdiction.coordinates.slice(0, 5).map((c) => ({
        lat: c[0],
        lng: c[1],
      }));
      jurisdictionPoints = [
        ...parsed,
        ...Array.from({ length: Math.max(0, 5 - parsed.length) }, () => ({
          lat: "",
          lng: "",
        })),
      ];
    }

    setFormData({
      AgencyName: agency.AgencyName,
      mobileNumber: agency.mobileNumber,
      password: "",
      eventResponsibleFor: Array.isArray(agency.eventResponsibleFor)
        ? agency.eventResponsibleFor.join(", ")
        : "",
      locationType: hasJurisdiction ? "jurisdiction" : "location",
      latitude: agency.location?.latitude || "20.2961",
      longitude: agency.location?.longitude || "85.8245",
      jurisdictionPoints,
    });

    setSelectedAgency(agency);
    setEditMode(true);
    setView("form");
    setError("");
    setSuccess("");
  };

  const handleDelete = async (agencyId) => {
    if (!window.confirm("Are you sure you want to delete this agency?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.delete(`/backend/agencies/${agencyId}`);
      if (res.data.success) {
        setSuccess("Agency deleted successfully");
        await fetchAgencies();
      } else setError("Failed to delete agency");
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting agency");
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!formData.AgencyName.trim()) {
      setError("Agency name is required");
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile number must be 10 digits");
      return false;
    }
    if (!editMode && !formData.password?.trim()) {
      setError("Password is required");
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError("Latitude and longitude are required");
      return false;
    }
    if (formData.locationType === "jurisdiction") {
      const valid = formData.jurisdictionPoints.filter((p) => p.lat && p.lng);
      if (valid.length < 3) {
        setError("At least 3 jurisdiction points are required");
        return false;
      }
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        AgencyName: formData.AgencyName,
        mobileNumber: formData.mobileNumber,
        eventResponsibleFor: formData.eventResponsibleFor
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude),
      };

      if (!editMode || formData.password?.trim())
        payload.password = formData.password;

      if (formData.locationType === "jurisdiction") {
        const coords = formData.jurisdictionPoints
          .filter((p) => p.lat && p.lng)
          .map((p) => [parseFloat(p.lat), parseFloat(p.lng)]);
        if (coords.length >= 3) {
          coords.push(coords[0]);
          payload.jurisdiction = { type: "Polygon", coordinates: coords };
        } else {
          payload.jurisdiction = null;
        }
      } else {
        payload.jurisdiction = null;
      }

      const res = editMode
        ? await api.put(`/backend/agencies/${selectedAgency.AgencyId}`, payload)
        : await api.post("/backend/agency", payload);

      if (res.data.success) {
        setSuccess(
          editMode
            ? "Agency updated successfully"
            : "Agency created successfully",
        );
        await fetchAgencies();
        setTimeout(() => setView("list"), 1500);
      } else {
        setError(res.data.message || "Operation failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Error ${editMode ? "updating" : "creating"} agency`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileUploadError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext === "json" || ext === "geojson") handleJSONUpload(content);
        else if (ext === "csv") handleCSVUpload(content);
        else
          setFileUploadError(
            "Unsupported file format. Please upload GeoJSON, JSON, or CSV.",
          );
      } catch (err) {
        setFileUploadError("Error reading file: " + err.message);
      }
    };
    reader.onerror = () => setFileUploadError("Error reading file");
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleJSONUpload = (content) => {
    try {
      const data = JSON.parse(content);
      if (data.type === "FeatureCollection" && data.features) {
        const feature = data.features[0];
        if (feature.geometry.type === "Polygon") {
          const coords = feature.geometry.coordinates[0].map((c) => ({
            lat: c[1],
            lng: c[0],
          }));
          if (coords.length >= 5)
            setFormData({
              ...formData,
              locationType: "jurisdiction",
              jurisdictionPoints: coords.slice(0, 5),
            });
          else setFileUploadError("Polygon must have at least 5 points");
        } else if (feature.geometry.type === "Point") {
          const [lng, lat] = feature.geometry.coordinates;
          setFormData({
            ...formData,
            locationType: "location",
            latitude: lat.toString(),
            longitude: lng.toString(),
          });
        }
      } else if (data.latitude && data.longitude) {
        setFormData({
          ...formData,
          locationType: "location",
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
        });
      } else if (data.coordinates && Array.isArray(data.coordinates)) {
        const coords = data.coordinates.map((c) => ({
          lat: c[0] || c.lat || "",
          lng: c[1] || c.lng || c.lon || "",
        }));
        if (coords.length >= 3) {
          const padded = [...coords];
          while (padded.length < 5) padded.push({ lat: "", lng: "" });
          setFormData({
            ...formData,
            locationType: "jurisdiction",
            jurisdictionPoints: padded.slice(0, 5),
          });
        } else {
          setFileUploadError(
            "Need at least 3 coordinate points for jurisdiction",
          );
        }
      } else {
        setFileUploadError(
          "Invalid JSON format. Expected GeoJSON or {latitude, longitude} or {coordinates: [...]}",
        );
      }
    } catch (err) {
      setFileUploadError("Invalid JSON format: " + err.message);
    }
  };

  const handleCSVUpload = (content) => {
    try {
      const lines = content.trim().split("\n");
      const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim());
      if (headers.includes("latitude") && headers.includes("longitude")) {
        const values = lines[1].split(",").map((v) => v.trim());
        setFormData({
          ...formData,
          locationType: "location",
          latitude: values[headers.indexOf("latitude")],
          longitude: values[headers.indexOf("longitude")],
        });
      } else if (
        (headers.includes("lat") || headers.includes("latitude")) &&
        (headers.includes("lng") ||
          headers.includes("lon") ||
          headers.includes("longitude"))
      ) {
        const latH = headers.find((h) => h === "lat" || h === "latitude");
        const lngH = headers.find(
          (h) => h === "lng" || h === "lon" || h === "longitude",
        );
        const latIdx = headers.indexOf(latH);
        const lngIdx = headers.indexOf(lngH);
        const coords = lines
          .slice(1)
          .map((l) => {
            const v = l.split(",").map((x) => x.trim());
            return { lat: v[latIdx] || "", lng: v[lngIdx] || "" };
          })
          .filter((c) => c.lat && c.lng);
        if (coords.length >= 3) {
          const padded = [...coords];
          while (padded.length < 5) padded.push({ lat: "", lng: "" });
          setFormData({
            ...formData,
            locationType: "jurisdiction",
            jurisdictionPoints: padded.slice(0, 5),
          });
        } else {
          setFileUploadError(
            "Need at least 3 coordinate points for jurisdiction",
          );
        }
      } else {
        setFileUploadError(
          "CSV must have latitude/longitude or lat/lng columns",
        );
      }
    } catch (err) {
      setFileUploadError("Error parsing CSV: " + err.message);
    }
  };

  // ── Notification ─────────────────────────────────────────────────────────
  const Notification = ({ type, message }) =>
    message ? (
      <div
        className={`fixed top-6 right-6 z-50 min-w-[320px] px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 transition-all ${
          type === "error"
            ? "bg-red-500/95 border-red-400 text-white"
            : "bg-emerald-500/95 border-emerald-400 text-white"
        }`}
      >
        <AlertCircle size={20} className="shrink-0" />
        <span className="text-sm font-semibold tracking-wide drop-shadow-sm">{message}</span>
      </div>
    ) : null;

  // ── Derived preview values ────────────────────────────────────────────────
  const previewTarget = React.useMemo(() => {
    if (formData.locationType === "jurisdiction") {
      const valid = formData.jurisdictionPoints
        .filter((p) => p.lat && p.lng)
        .map((p) => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));
      if (valid.length >= 3) return { type: 'polygon', paths: valid };
    }
    if (formData.latitude && formData.longitude) {
      return { type: 'point', lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) };
    }
    return { type: 'point', lat: 20.2961, lng: 85.8245 };
  }, [formData]);

  const previewPolygonPaths = previewTarget.type === 'polygon' ? previewTarget.paths : null;

  // ════════════════════════════════════════════════════════════════════════
  // FORM VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (view === "form") {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
        <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-sky-200/30 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-cyan-200/30 blur-[100px] pointer-events-none" />

        <Notification type="error" message={error} />
        <Notification type="success" message={success} />

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                className="h-12 w-auto object-contain drop-shadow-sm"
                onError={(e) => (e.target.style.display = "none")}
              />
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
              <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-sky-800 to-cyan-700 bg-clip-text text-transparent">
                {editMode ? "Edit Agency" : "Add New Agency"}
              </p>
            </div>
            <button
              onClick={() => setView("list")}
              className="px-5 py-2 cursor-pointer bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all font-semibold text-sm flex items-center gap-2"
            >
              <X size={16} className="text-slate-500" />
              Cancel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 py-2 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
              {/* ── Form panel ───────────────────────────────────────────── */}
              <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="border-b border-slate-100 bg-white/50 px-5 py-4 flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                    <Edit2 size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Agency Details
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Agency Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.AgencyName}
                        onChange={(e) => setFormData({ ...formData, AgencyName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-500 shadow-inner"
                        placeholder="Enter agency moniker"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.mobileNumber}
                        maxLength={10}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-500 shadow-inner tracking-wider"
                        placeholder="10-digit mobile number"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2 flex justify-between">
                        <span>Authentication Key {editMode ? "" : <span className="text-rose-500">*</span>}</span>
                        {editMode && <span className="text-xs font-normal text-slate-500 italic">(leave blank to preserve)</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-500 shadow-inner"
                        placeholder={editMode ? "Keep current secure key" : "Assign secure key"}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Managed Incident Types
                      </label>
                      <input
                        type="text"
                        value={formData.eventResponsibleFor}
                        onChange={(e) => setFormData({ ...formData, eventResponsibleFor: e.target.value })}
                        placeholder="e.g. Infrastructure, Street Lights"
                        className="w-full px-4 py-3 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-500 shadow-inner"
                        disabled={loading}
                      />
                      <p className="text-xs text-slate-500 mt-2 pl-1 font-medium">Use commas to assign multiple incident categories</p>
                    </div>

                    <div>
                      <div className="p-5 bg-blue-900/10 rounded-xl border border-blue-500/20 shadow-inner">
                        <label className="block text-sm font-semibold text-slate-200 mb-4">
                          Location Coordinates <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-blue-400 mb-1.5 tracking-wide uppercase">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-600 shadow-inner font-mono"
                              placeholder="20.2961"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-400 mb-1.5 tracking-wide uppercase">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-[#0f172a]/50 text-sm text-white placeholder-slate-600 shadow-inner font-mono"
                              placeholder="85.8245"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-400/80 mt-3 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                          <MapPin size={12} /> Primary map pin anchor
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="block text-sm font-semibold text-slate-200 mb-4">
                        Jurisdiction Area <span className="text-slate-500 font-normal ml-1 italic">(Optional bounded zone)</span>
                      </h3>
                      <div className="flex gap-4 mb-5">
                        {["location", "jurisdiction"].map((val) => (
                          <label
                            key={val}
                            className={`flex items-center cursor-pointer px-4 py-3.5 rounded-xl border transition-all flex-1 ${formData.locationType === val ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#0f172a]/40 border-slate-700/50 hover:border-slate-600'}`}
                          >
                            <input
                              type="radio"
                              value={val}
                              checked={formData.locationType === val}
                              onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                              className="mr-3 w-4 h-4 accent-blue-500 cursor-pointer"
                              disabled={loading}
                            />
                            <span className={`text-sm font-semibold tracking-wide ${formData.locationType === val ? 'text-blue-400' : 'text-slate-400'}`}>
                              {val === "location" ? "Single Location" : "Define Area Polygon"}
                            </span>
                          </label>
                        ))}
                      </div>

                      {formData.locationType === "jurisdiction" && (
                        <>
                          <div className="bg-[#0f172a]/60 border border-slate-700/50 rounded-xl p-4 mb-4 shadow-inner">
                            <div className="flex items-start gap-4 mb-3">
                              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Upload size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-slate-200 mb-1 text-sm tracking-wide">
                                  Import Geometry
                                </h5>
                                <p className="text-xs text-slate-400 mb-2.5">
                                  Upload coordinates payload
                                </p>
                                <input
                                  type="file"
                                  accept=".json,.geojson,.csv"
                                  onChange={handleFileUpload}
                                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 file:cursor-pointer cursor-pointer file:transition-all"
                                  disabled={loading}
                                />
                                {fileUploadError && (
                                  <p className="text-[11px] text-rose-400 mt-2 font-semibold">
                                    {fileUploadError}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 space-y-1 pl-[3.25rem] font-mono leading-relaxed">
                              <p className="font-bold text-slate-400 tracking-wider">SUPPORTED FORMATS</p>
                              <p>• JSON Geo - {`{"coordinates": [[lat, lng], ...]}`}</p>
                              <p>• CSV Data - lat/lng headers</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 my-6">
                            <div className="h-px bg-slate-700/50 flex-1"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or manually plot</span>
                            <div className="h-px bg-slate-700/50 flex-1"></div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">
                              Jurisdictional Nodes (Minimum 3 points)
                            </label>
                            <div className="space-y-2">
                              {formData.jurisdictionPoints.map((point, index) => (
                                <div key={index} className="grid grid-cols-2 mb-1 gap-2 border border-slate-800/50 p-1.5 rounded-lg bg-[#0f172a]/30">
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder={`Node ${index + 1} Lat`}
                                    value={point.lat}
                                    onChange={(e) => {
                                      const pts = [...formData.jurisdictionPoints];
                                      pts[index] = { ...pts[index], lat: e.target.value };
                                      setFormData({ ...formData, jurisdictionPoints: pts });
                                    }}
                                    className="px-3 py-2 bg-[#0b1120] border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono text-xs text-slate-300 transition-all placeholder-slate-600"
                                    disabled={loading}
                                  />
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder={`Node ${index + 1} Lng`}
                                    value={point.lng}
                                    onChange={(e) => {
                                      const pts = [...formData.jurisdictionPoints];
                                      pts[index] = { ...pts[index], lng: e.target.value };
                                      setFormData({ ...formData, jurisdictionPoints: pts });
                                    }}
                                    className="px-3 py-2 bg-[#0b1120] border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono text-xs text-slate-300 transition-all placeholder-slate-600"
                                    disabled={loading}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-white/10 mt-6">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-5 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Processing Configuration...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            {editMode ? "Save Configuration" : "Deploy Agency Profile"}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setView("list")}
                        disabled={loading}
                        className="px-6 py-3.5 bg-[#0f172a] border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                      >
                        <X size={18} />
                        Abort
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Form Map Preview ──────────────────────────────────────────
                  Matches Leaflet form preview EXACTLY:
                  • Location Marker is ALWAYS visible (lat/lng always provided)
                  • Jurisdiction Polygon is shown ON TOP of the marker when
                    locationType="jurisdiction" and >= 3 valid points exist.
                  Both can appear simultaneously, just like Leaflet.
              ──────────────────────────────────────────────────────────── */}
              <div className="bg-[#1e293b]/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
                <div className="border-b border-white/5 bg-white/5 px-6 py-5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                      <MapPin size={20} />
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wider uppercase">
                      Geographical Preview
                    </h3>
                  </div>
                </div>
                <div className="flex-1 p-3 bg-[#0b1120]/50 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none z-10 opacity-20" />
                  <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-inner h-full w-full relative z-0">
                    <LoadScript
                      googleMapsApiKey={
                        import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
                      }
                    >
                      <GoogleMap
                        center={{ lat: previewTarget.lat || 20.2961, lng: previewTarget.lng || 85.8245 }}
                        zoom={13}
                        mapContainerStyle={{ height: "100%", width: "100%" }}
                        options={mapOptions}
                      >
                        <MapUpdater target={previewTarget} />

                        {/* ① Always show location marker (Leaflet does this too) */}
                        {formData.latitude && formData.longitude && (
                          <Marker
                            position={{
                              lat: parseFloat(formData.latitude),
                              lng: parseFloat(formData.longitude),
                            }}
                            onClick={() =>
                              setActiveInfo({
                                position: {
                                  lat: parseFloat(formData.latitude),
                                  lng: parseFloat(formData.longitude),
                                },
                                content: (
                                  <div className="text-center font-sans tracking-wide">
                                    <strong className="text-blue-500 font-black uppercase text-xs">
                                      {formData.AgencyName || "Unassigned"}
                                    </strong>
                                    <br />
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      Primary Node
                                    </span>
                                  </div>
                                ),
                              })
                            }
                          />
                        )}

                        {/* ② Show jurisdiction polygon ON TOP when ready (Leaflet does this too) */}
                        {formData.locationType === "jurisdiction" &&
                          previewPolygonPaths && (
                            <Polygon
                              paths={previewPolygonPaths}
                              options={polygonOptions}
                              onClick={() =>
                                setActiveInfo({
                                  position: previewPolygonPaths[0],
                                  content: (
                                    <div className="text-center font-sans tracking-wide">
                                      <strong className="text-purple-500 font-black uppercase text-xs">
                                        {formData.AgencyName || "Unassigned"}
                                      </strong>
                                      <br />
                                      <span className="text-[10px] text-slate-500 font-bold">
                                        Jurisdiction Perimeter
                                      </span>
                                    </div>
                                  ),
                                })
                              }
                            />
                          )}

                        {activeInfo && (
                          <InfoWindow
                            position={activeInfo.position}
                            onCloseClick={() => setActiveInfo(null)}
                          >
                            {activeInfo.content}
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop guard ─────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
          color: "#fff",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
            🖥️ Desktop Required
          </h1>
          <p style={{ fontSize: "16px", opacity: 0.9 }}>
            This dashboard is optimized for desktop screens.
          </p>
          <p style={{ fontSize: "14px", opacity: 0.7 }}>
            Please open it on a laptop or desktop device.
          </p>
        </div>
      </div>
    );
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!isLoggedIn) return <AdminAuth onLogin={handleLogin} />;

  // ════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen overflow-hidden bg-[#0b1120] text-slate-200 flex flex-col relative font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />

      <Notification type="error" message={error} />
      <Notification type="success" message={success} />

      {/* Header */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10 shadow-2xl">
        <div className="w-full max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                className="h-10 w-auto object-contain brightness-0 invert opacity-90"
                onError={(e) => (e.target.style.display = "none")}
              />
              <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>
              <p className="font-bold text-lg sm:text-xl tracking-wide text-white drop-shadow-md">
                Admin Station
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAgencies}
                disabled={loading}
                className="hidden md:flex px-4 py-2 bg-[#1e293b]/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all items-center gap-2 font-semibold text-sm disabled:opacity-50 shadow-inner"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-blue-400" : "text-slate-400"} />
                Sync Mode
              </button>
              <button
                onClick={switchModel}
                disabled={modelLoading}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all flex items-center gap-2 font-bold text-sm disabled:opacity-50 shadow-inner tracking-wide"
              >
                <RefreshCw size={16} className={modelLoading ? "animate-spin" : ""} />
                {activeModel === "YOLO" ? "VLM Engine Active" : "YOLO Engine Active"}
              </button>
              <button
                onClick={handleAddNew}
                className="px-5 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] flex items-center gap-2 font-bold text-sm tracking-wide"
              >
                <Plus size={18} />
                Deploy Agency
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 cursor-pointer bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-2 font-bold text-sm ml-2 shadow-inner uppercase tracking-wider text-[11px]"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-3 py-2 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
            {/* ── Agencies List ─────────────────────────────────────────── */}
            <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="border-b border-white/5 bg-white/5 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
                    <MapPin size={20} />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-wider uppercase">Active Network</h2>
                </div>
                <span className="text-xs bg-blue-900/50 text-blue-300 px-3 py-1.5 rounded-full font-bold border border-blue-700/50">
                  {agencies.length} NODES
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading && agencies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw
                        size={32}
                        className="animate-spin text-blue-500 mx-auto mb-3"
                      />
                      <p className="text-slate-400 text-sm tracking-wide font-medium">Syncing Network Database...</p>
                    </div>
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-slate-500 mb-3 text-sm">Network structure uninitialized</p>
                      <button
                        onClick={handleAddNew}
                        className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest text-xs tracking-wider border-b border-blue-400/30 pb-1 transition-colors"
                      >
                        Deploy Initial Node
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agencies.map((agency) => (
                      <div
                        key={agency._id}
                        className="group border mb-3 border-slate-700/50 rounded-2xl p-5 hover:bg-[#0f172a]/60 hover:border-blue-500/50 transition-all bg-[#0f172a]/40 relative overflow-hidden shadow-inner flex flex-col"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900/20 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="font-bold text-lg text-slate-100 truncate mb-1">
                              {agency.AgencyName}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pb-2 border-b border-slate-700/50">
                              <p className="flex items-center gap-1.5 text-xs bg-[#0b1120] px-2.5 py-1 rounded border border-slate-800 tracking-wider">
                                <span className="opacity-60 text-blue-400">UID:</span> <span className="text-slate-300 font-mono">{agency.AgencyId}</span>
                              </p>
                              <p className="flex items-center gap-1.5 opacity-80">
                                📱 <span className="text-slate-300 font-mono">{agency.mobileNumber}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleEdit(agency)}
                              disabled={loading}
                              className="p-2.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg transition-all shadow-inner disabled:opacity-50"
                              title="Reconfigure"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(agency.AgencyId)}
                              disabled={loading}
                              className="p-2.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg transition-all shadow-inner disabled:opacity-50"
                              title="Terminate"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 mt-1">
                          <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest px-0.5">
                            Target Classifications
                          </p>
                          {agency.eventResponsibleFor?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {agency.eventResponsibleFor.map((ev, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/50 px-2.5 py-1 rounded-md font-bold tracking-wider uppercase shadow-inner"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic px-0.5">
                              Unclassified assignment
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-700/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                              <MapPin size={12} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {agency.jurisdiction?.coordinates ? "POLYGON" : "POINT"}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleViewOnMap(agency)}
                            className="text-[11px] uppercase tracking-widest font-bold text-blue-400 hover:text-white transition-all bg-blue-500/10 hover:bg-blue-500 hover:scale-105 hover:-translate-y-0.5 shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] px-4 py-2 rounded border border-blue-500/30"
                          >
                            Trace Signal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Main Map View ─────────────────────────────────────────────
                Matches Leaflet list map exactly:
                • Has jurisdiction  → Polygon only  (click = InfoWindow popup)
                • No jurisdiction   → Marker only   (click = InfoWindow popup)
                • "View on Map" updates mapCenter → MapUpdater animates to it
            ──────────────────────────────────────────────────────────── */}
            <div className="bg-[#1e293b]/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl relative">
              <div className="border-b border-white/5 bg-white/5 px-6 py-5 flex items-center justify-between z-10 w-full">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                    <MapPin size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wider uppercase">Regional Surveillance Map</h3>
                </div>
              </div>
              <div className="flex-1 p-3 bg-[#0b1120]/50 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none z-10 opacity-20" />
                <div className="h-full rounded-xl overflow-hidden border border-slate-700/50 relative z-0 shadow-inner w-full">
                  <LoadScript
                    googleMapsApiKey={
                      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
                    }
                  >
                    <GoogleMap
                      center={{ lat: mapTarget.lat || 20.2961, lng: mapTarget.lng || 85.8245 }}
                      zoom={13}
                      mapContainerStyle={{ height: "100%", width: "100%" }}
                      options={mapOptions}
                    >
                      {/* Animates pan+zoom when mapCenter changes ("View on Map") */}
                      <MapUpdater target={mapTarget} />

                      {agencies.map((agency) => (
                        <React.Fragment key={agency._id}>
                          {agency.jurisdiction &&
                          agency.jurisdiction.coordinates ? (
                            /* ── Has jurisdiction → Polygon only ─────────────── */
                            <Polygon
                              paths={agency.jurisdiction.coordinates.map(
                                (coord) => ({
                                  lat: coord[0], // coord[0] = lat (DB format)
                                  lng: coord[1], // coord[1] = lng (DB format)
                                }),
                              )}
                              options={polygonOptions}
                              onClick={() => {
                                const first =
                                  agency.jurisdiction.coordinates[0];
                                setActiveInfo({
                                  position: { lat: first[0], lng: first[1] },
                                  content: (
                                  <div className="text-center font-sans tracking-wide">
                                    <strong className="text-purple-500 font-black uppercase text-xs">
                                      {agency.AgencyName}
                                    </strong>
                                    <br />
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      Jurisdiction Perimeter
                                    </span>
                                    <br />
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      LINK: {agency.mobileNumber}
                                    </span>
                                  </div>
                                  ),
                                });
                              }}
                            />
                          ) : (
                            /* ── No jurisdiction → Marker only ───────────────── */
                            agency.location && (
                              <Marker
                                position={{
                                  lat: agency.location.latitude,
                                  lng: agency.location.longitude,
                                }}
                                onClick={() =>
                                  setActiveInfo({
                                    position: {
                                      lat: agency.location.latitude,
                                      lng: agency.location.longitude,
                                    },
                                    content: (
                                      <div className="text-center font-sans tracking-wide">
                                        <strong className="text-blue-500 font-black uppercase text-xs">
                                          {agency.AgencyName}
                                        </strong>
                                        <br />
                                        <span className="text-[10px] text-slate-500 font-bold">
                                          Primary Node
                                        </span>
                                        <br />
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          LINK: {agency.mobileNumber}
                                        </span>
                                      </div>
                                    ),
                                  })
                                }
                              />
                            )
                          )}
                        </React.Fragment>
                      ))}

                      {activeInfo && (
                        <InfoWindow
                          position={activeInfo.position}
                          onCloseClick={() => setActiveInfo(null)}
                        >
                          {activeInfo.content}
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAgencyManager;
