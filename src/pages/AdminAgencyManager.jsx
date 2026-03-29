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

// ── MapUpdater ────────────────────────────────────────────────────────────────
// Matches Leaflet's map.setView(center, 13) — animated pan + zoom together.
// Called every time mapCenter state changes (e.g. "View on Map" click).
const MapUpdater = ({ center }) => {
  const map = useGoogleMap();
  useEffect(() => {
    if (!center || !Array.isArray(center) || center.length !== 2) return;
    const [lat, lng] = center;
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    )
      return;
    // setCenter + setZoom together mirrors Leaflet setView(center, 13)
    map.setCenter({ lat, lng });
    map.setZoom(13);
  }, [center, map]);
  return null;
};

// ── Shared map options / polygon style ───────────────────────────────────────
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const polygonOptions = {
  strokeColor: "#0284c7",
  strokeOpacity: 1,
  strokeWeight: 2,
  fillColor: "#7dd3fc",
  fillOpacity: 0.4,
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
  const [mapCenter, setMapCenter] = useState([20.2961, 85.8245]);
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

  // ── handleViewOnMap — identical to Leaflet version ───────────────────────
  // Leaflet only uses agency.location; MapUpdater does setCenter+setZoom (=setView)
  const handleViewOnMap = (agency) => {
    if (agency.location) {
      setMapCenter([agency.location.latitude, agency.location.longitude]);
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
  // previewCenter: always from formData lat/lng
  const previewCenter =
    formData.latitude && formData.longitude
      ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
      : [20.2961, 85.8245];

  // previewPolygonPaths: Google Maps {lat,lng} objects, null if not ready
  const previewPolygonPaths = (() => {
    if (formData.locationType !== "jurisdiction") return null;
    const valid = formData.jurisdictionPoints
      .filter((p) => p.lat && p.lng)
      .map((p) => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));
    return valid.length >= 3 ? valid : null;
  })();

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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Agency Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.AgencyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            AgencyName: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-slate-50 hover:bg-white text-sm text-slate-800 placeholder-slate-400"
                        placeholder="Enter agency name"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.mobileNumber}
                        maxLength={10}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mobileNumber: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-slate-50 hover:bg-white text-sm text-slate-800 placeholder-slate-400"
                        placeholder="10-digit mobile number"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                        <span>Password {editMode ? "" : <span className="text-red-500">*</span>}</span>
                        {editMode && <span className="text-xs font-normal text-slate-400">(leave blank to keep current)</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-slate-50 hover:bg-white text-sm text-slate-800 placeholder-slate-400"
                        placeholder={
                          editMode
                            ? "Leave blank to keep current password"
                            : "Enter password"
                        }
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Events Responsible For
                      </label>
                      <input
                        type="text"
                        value={formData.eventResponsibleFor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventResponsibleFor: e.target.value,
                          })
                        }
                        placeholder="e.g., Road Damage, Street Light"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all bg-slate-50 hover:bg-white text-sm text-slate-800 placeholder-slate-400"
                        disabled={loading}
                      />
                      <p className="text-xs text-slate-500 mt-1 pl-1">
                        Separate multiple events with commas
                      </p>
                    </div>

                    <div>
                      <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Location Coordinates <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Latitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.latitude}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  latitude: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-white text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                              placeholder="20.2961"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Longitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={formData.longitude}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  longitude: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-white text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                              placeholder="85.8245"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                          <MapPin size={12} className="text-sky-500" />
                          Primary map location
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="block text-sm font-semibold text-slate-700 mb-3">
                        Jurisdiction Area <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                      </h3>
                      <div className="flex gap-3 mb-4">
                        {["location", "jurisdiction"].map((val) => (
                          <label
                            key={val}
                            className={`flex items-center cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex-1 ${formData.locationType === val ? 'bg-sky-50 border-sky-500 shadow-sm' : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'}`}
                          >
                            <input
                              type="radio"
                              value={val}
                              checked={formData.locationType === val}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  locationType: e.target.value,
                                })
                              }
                              className="mr-2 w-4 h-4 accent-sky-600 cursor-pointer"
                              disabled={loading}
                            />
                            <span className={`text-sm font-semibold ${formData.locationType === val ? 'text-sky-800' : 'text-slate-600'}`}>
                              {val === "location"
                                ? "Single Location"
                                : "Define Area Polygon"}
                            </span>
                          </label>
                        ))}
                      </div>

                      {formData.locationType === "jurisdiction" && (
                        <>
                          <div className="bg-sky-50 border border-sky-200 rounded-md p-2 mb-2">
                            <div className="flex items-start gap-2 mb-2">
                              <Upload
                                size={16}
                                className="text-sky-600 mt-0.5 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-800 mb-0.5 text-xs">
                                  Import from File
                                </h5>
                                <p className="text-xs text-gray-600 mb-1.5">
                                  Upload polygon coordinates
                                </p>
                                <input
                                  type="file"
                                  accept=".json,.geojson,.csv"
                                  onChange={handleFileUpload}
                                  className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 file:cursor-pointer cursor-pointer"
                                  disabled={loading}
                                />
                                {fileUploadError && (
                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                    {fileUploadError}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5 pl-5">
                              <p className="font-semibold text-gray-700">
                                Formats:
                              </p>
                              <p>
                                • JSON: {`{"coordinates": [[lat, lng], ...]}`}
                              </p>
                              <p>• CSV: lat/lng columns with multiple rows</p>
                            </div>
                          </div>

                          <div className="text-center text-xs font-medium text-gray-500 my-1">
                            OR
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Jurisdiction Points (minimum 3 points)
                            </label>
                            <div className="space-y-1.5">
                              {formData.jurisdictionPoints.map(
                                (point, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-2 mb-1 gap-1.5"
                                  >
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder={`Point ${index + 1} Lat`}
                                      value={point.lat}
                                      onChange={(e) => {
                                        const pts = [
                                          ...formData.jurisdictionPoints,
                                        ];
                                        pts[index] = {
                                          ...pts[index],
                                          lat: e.target.value,
                                        };
                                        setFormData({
                                          ...formData,
                                          jurisdictionPoints: pts,
                                        });
                                      }}
                                      className="px-2 py-1 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs transition-all"
                                      disabled={loading}
                                    />
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder={`Point ${index + 1} Lng`}
                                      value={point.lng}
                                      onChange={(e) => {
                                        const pts = [
                                          ...formData.jurisdictionPoints,
                                        ];
                                        pts[index] = {
                                          ...pts[index],
                                          lng: e.target.value,
                                        };
                                        setFormData({
                                          ...formData,
                                          jurisdictionPoints: pts,
                                        });
                                      }}
                                      className="px-2 py-1 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs transition-all"
                                      disabled={loading}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl hover:from-sky-700 hover:to-sky-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-sky-600/20"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            {editMode ? "Save Changes" : "Create Agency"}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setView("list")}
                        disabled={loading}
                        className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={18} />
                        Cancel
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
              <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="border-b border-slate-100 bg-white/50 px-5 py-4 flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Location Preview
                  </h3>
                </div>
                <div className="flex-1 p-3 bg-slate-50/50">
                  <div className="rounded-xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200 h-full relative">
                    <LoadScript
                      googleMapsApiKey={
                        import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
                      }
                    >
                      <GoogleMap
                        center={{
                          lat: previewCenter[0],
                          lng: previewCenter[1],
                        }}
                        zoom={13}
                        mapContainerStyle={{ height: "100%", width: "100%" }}
                        options={mapOptions}
                      >
                        <MapUpdater center={previewCenter} />

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
                                  <div className="text-center">
                                    <strong className="text-sky-700">
                                      {formData.AgencyName || "New Agency"}
                                    </strong>
                                    <br />
                                    <span className="text-xs text-gray-600">
                                      Primary Location
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
                                    <div className="text-center">
                                      <strong className="text-sky-700">
                                        {formData.AgencyName || "New Agency"}
                                      </strong>
                                      <br />
                                      <span className="text-xs text-gray-600">
                                        Jurisdiction Area
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
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-200/30 blur-[120px] pointer-events-none" />

      <Notification type="error" message={error} />
      <Notification type="success" message={success} />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                className="h-12 w-auto object-contain drop-shadow-sm"
                onError={(e) => (e.target.style.display = "none")}
              />
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
              <p className="font-black text-xl sm:text-2xl bg-gradient-to-r from-sky-800 to-cyan-700 bg-clip-text text-transparent">
                Super Admin
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAgencies}
                disabled={loading}
                className="hidden md:flex px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all items-center gap-2 font-bold text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-sky-500" : "text-slate-500"} />
                Refresh
              </button>
              <button
                onClick={switchModel}
                disabled={modelLoading}
                className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 shadow-sm transition-all flex items-center gap-2 font-bold text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={modelLoading ? "animate-spin" : ""} />
                {activeModel === "YOLO" ? "Switch to VLM" : "Switch to YOLO"}
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 cursor-pointer bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl hover:from-sky-700 hover:to-sky-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-bold text-sm border border-sky-600/20"
              >
                <Plus size={18} />
                Add Agency
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 cursor-pointer bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 font-bold text-sm ml-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-3 py-2 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
            {/* ── Agencies List ─────────────────────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="border-b border-slate-100 bg-white/50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                    <MapPin size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Agencies List</h2>
                </div>
                <span className="text-sm text-sky-700 font-medium">
                  {agencies.length}{" "}
                  {agencies.length === 1 ? "agency" : "agencies"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {loading && agencies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw
                        size={32}
                        className="animate-spin text-sky-500 mx-auto mb-2"
                      />
                      <p className="text-gray-600">Loading agencies...</p>
                    </div>
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">No agencies found</p>
                      <button
                        onClick={handleAddNew}
                        className="text-sky-600 hover:text-sky-700 font-semibold"
                      >
                        Create your first agency
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {agencies.map((agency) => (
                      <div
                        key={agency._id}
                        className="group border mb-3 border-slate-200 rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-sky-300 transition-all bg-white relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-bold text-lg text-slate-800 truncate mb-1">
                              {agency.AgencyName}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pb-2 border-b border-slate-50">
                              <p className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                <span className="opacity-70">ID:</span> <span className="text-slate-700 font-mono">{agency.AgencyId}</span>
                              </p>
                              <p className="flex items-center gap-1">
                                <span className="opacity-70">📱</span> <span className="text-slate-700">{agency.mobileNumber}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(agency)}
                              disabled={loading}
                              className="p-2 text-sky-600 bg-white border border-sky-100 hover:bg-sky-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(agency.AgencyId)}
                              disabled={loading}
                              className="p-2 text-red-500 bg-white border border-red-100 hover:bg-red-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3 mt-2">
                          <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Events Responsible For
                          </p>
                          {agency.eventResponsibleFor?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {agency.eventResponsibleFor.map((ev, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-lg font-bold tracking-wide"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No events assigned
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                          <p className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <MapPin size={14} className="text-emerald-500" />
                            {agency.jurisdiction?.coordinates
                              ? "Jurisdiction Area Defined"
                              : "Location Point Pin"}
                          </p>
                          <button
                            onClick={() => handleViewOnMap(agency)}
                            className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold transition-colors bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-100"
                          >
                            View on Map →
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
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="border-b border-slate-100 bg-white/50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Map View Overview</h3>
                </div>
              </div>
              <div className="flex-1 p-3 bg-slate-50/50">
                <div className="h-full rounded-xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200 relative">
                  <LoadScript
                    googleMapsApiKey={
                      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
                    }
                  >
                    <GoogleMap
                      center={{ lat: mapCenter[0], lng: mapCenter[1] }}
                      zoom={13}
                      mapContainerStyle={{ height: "100%", width: "100%" }}
                      options={mapOptions}
                    >
                      {/* Animates pan+zoom when mapCenter changes ("View on Map") */}
                      <MapUpdater center={mapCenter} />

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
                                    <div>
                                      <strong className="text-sky-700">
                                        {agency.AgencyName}
                                      </strong>
                                      <br />
                                      <span className="text-xs text-gray-600">
                                        Jurisdiction Area
                                      </span>
                                      <br />
                                      <span className="text-xs text-gray-600">
                                        📱 {agency.mobileNumber}
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
                                      <div>
                                        <strong className="text-sky-700">
                                          {agency.AgencyName}
                                        </strong>
                                        <br />
                                        <span className="text-xs text-gray-600">
                                          📱 {agency.mobileNumber}
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
