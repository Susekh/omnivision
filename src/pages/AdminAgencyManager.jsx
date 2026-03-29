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
        className={`fixed top-4 right-4 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
      >
        <AlertCircle size={18} />
        <span className="text-sm font-medium">{message}</span>
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
      <div
        className="h-screen flex flex-col bg-linear-to-br from-sky-100 via-cyan-50 to-blue-100 overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(rgba(14,165,233,0.15) 1px,transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      >
        <Notification type="error" message={error} />
        <Notification type="success" message={success} />

        {/* Header */}
        <div className="bg-sky-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                className="h-14 w-auto"
                onError={(e) => (e.target.style.display = "none")}
              />
              <p className="text-3xl mt-2 font-bold text-neutral-700">
                {editMode ? "Edit Agency" : "Add New Agency"}
              </p>
            </div>
            <div
              onClick={() => setView("list")}
              className="px-3 py-2 cursor-pointer bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all font-medium text-sm"
            >
              Back to List
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 py-2 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
              {/* ── Form panel ───────────────────────────────────────────── */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
                <div className="bg-sky-300 px-3 py-2">
                  <p className="text-2xl font-bold text-sky-800">
                    Agency Details
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Agency Name *
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
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder="Enter agency name"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mobile Number *
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
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder="10-digit mobile number"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Password{" "}
                        {editMode ? "(leave blank to keep current)" : "*"}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder={
                          editMode
                            ? "Leave blank to keep current password"
                            : "Enter password"
                        }
                        disabled={loading}
                      />
                      {editMode && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Only fill this if you want to change the password
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">
                        Separate multiple events with commas
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Location Coordinates *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Latitude *
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
                            className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                            placeholder="20.2961"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Longitude *
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
                            className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                            placeholder="85.8245"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Primary location coordinates (always required)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Jurisdiction Area (Optional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        {["location", "jurisdiction"].map((val) => (
                          <label
                            key={val}
                            className="flex items-center cursor-pointer bg-sky-50 px-2.5 py-1.5 rounded-md border border-sky-300 hover:bg-sky-100 transition-all flex-1"
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
                              className="mr-1.5 w-3 h-3 accent-sky-500"
                              disabled={loading}
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {val === "location"
                                ? "No Jurisdiction"
                                : "Add Jurisdiction"}
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

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all flex items-center justify-center gap-1.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            {editMode ? "Update" : "Create"}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setView("list")}
                        disabled={loading}
                        className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all flex items-center gap-1.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} />
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
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
                <div className="bg-sky-300 px-3 py-2 flex items-center gap-1.5">
                  <MapPin size={18} className="text-sky-800" />
                  <h4 className="text-base font-bold text-sky-800">
                    Location Preview
                  </h4>
                </div>
                <div className="flex-1 p-2">
                  <div className="rounded-lg overflow-hidden border-2 border-sky-200 h-full">
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
    <div
      className="h-screen overflow-hidden bg-linear-to-br from-sky-100 via-cyan-50 to-blue-100 flex flex-col"
      style={{
        backgroundImage: `radial-gradient(rgba(14,165,233,0.15) 1px,transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    >
      <Notification type="error" message={error} />
      <Notification type="success" message={success} />

      {/* Header */}
      <div className="bg-sky-200 shadow-sm">
        <div className="container mx-auto px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/images/omnivision-logo.png"
                alt="OmniVision Logo"
                className="h-14 w-auto"
                onError={(e) => (e.target.style.display = "none")}
              />
              <p className="mt-2 font-bold text-3xl text-neutral-700">
                Super Admin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAgencies}
                disabled={loading}
                className="px-3 py-2 bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all flex items-center gap-1.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={switchModel}
                disabled={modelLoading}
                className="px-3 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-1.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={18}
                  className={modelLoading ? "animate-spin" : ""}
                />
                {activeModel === "YOLO" ? "Switch to VLM" : "Switch to YOLO"}
              </button>
              <button
                onClick={handleAddNew}
                className="px-3 py-2 cursor-pointer bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all flex items-center gap-1.5 font-medium text-sm"
              >
                <Plus size={18} />
                Add Agency
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 cursor-pointer bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-1.5 font-medium text-sm"
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
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
              <div className="bg-sky-300 px-3 py-1 flex items-center justify-between">
                <p className="text-2xl font-bold text-sky-800">Agencies List</p>
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
                        className="border mb-2 border-sky-200 rounded-lg p-3 hover:shadow-md hover:border-sky-300 transition-all bg-white"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-sky-700 truncate">
                              {agency.AgencyName}
                            </h3>
                            <p className="text-xs text-gray-600">
                              ID: {agency.AgencyId}
                            </p>
                            <p className="text-xs text-gray-600">
                              📱 {agency.mobileNumber}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEdit(agency)}
                              disabled={loading}
                              className="btn p-1.5 text-sky-600 hover:bg-sky-100 rounded-md transition-all disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(agency.AgencyId)}
                              disabled={loading}
                              className="btn p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Events:
                          </p>
                          {agency.eventResponsibleFor?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {agency.eventResponsibleFor.map((ev, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-medium"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">
                              No events assigned
                            </span>
                          )}
                        </div>

                        <div className="text-xs">
                          <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <MapPin size={14} className="text-sky-600" />
                            {agency.jurisdiction?.coordinates
                              ? "Jurisdiction Area"
                              : "Location Point"}
                          </p>
                          {/* "View on Map" pans+zooms to agency.location via MapUpdater */}
                          <button
                            onClick={() => handleViewOnMap(agency)}
                            className="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
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
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
              <div className="bg-sky-300 px-3 py-2 flex items-center gap-1.5">
                <MapPin size={18} className="text-sky-800" />
                <h3 className="text-base font-bold text-sky-800">Map View</h3>
              </div>
              <div className="flex-1 p-2">
                <div className="h-full rounded-lg overflow-hidden border-2 border-sky-200">
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
