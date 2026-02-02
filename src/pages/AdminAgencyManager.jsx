import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import { Trash2, Edit2, Plus, Eye, EyeOff, Save, X, MapPin, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ FIXED: MapUpdater with proper validation
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        map.setView(center, 13);
      }
    }
  }, [center, map]);
  return null;
};

const AdminAgencyManager = () => {
  const [agencies, setAgencies] = useState([]);
  const [view, setView] = useState('list');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [mapCenter, setMapCenter] = useState([20.2961, 85.8245]);
  const [fileUploadError, setFileUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    AgencyName: '',
    mobileNumber: '',
    password: '',
    eventResponsibleFor: '',
    locationType: 'location',
    latitude: '',
    longitude: '',
    jurisdictionPoints: [
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' }
    ]
  });

  // Fetch agencies on component mount
  useEffect(() => {
    fetchAgencies();
  }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchAgencies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/backend/agencies');
      if (response.data.success) {
        setAgencies(response.data.data);
      } else {
        setError('Failed to fetch agencies');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching agencies');
      console.error('Error fetching agencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPreviewMapCenter = () => {
    if (formData.locationType === 'location' && formData.latitude && formData.longitude) {
      return [parseFloat(formData.latitude), parseFloat(formData.longitude)];
    } else if (formData.locationType === 'jurisdiction') {
      const validPoints = formData.jurisdictionPoints.filter(p => p.lat && p.lng);
      if (validPoints.length > 0) {
        const avgLat = validPoints.reduce((sum, p) => sum + parseFloat(p.lat), 0) / validPoints.length;
        const avgLng = validPoints.reduce((sum, p) => sum + parseFloat(p.lng), 0) / validPoints.length;
        return [avgLat, avgLng];
      }
    }
    return [20.2961, 85.8245];
  };

  const getPreviewPolygonCoords = () => {
    if (formData.locationType === 'jurisdiction') {
      const validPoints = formData.jurisdictionPoints
        .filter(p => p.lat && p.lng)
        .map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
      
      if (validPoints.length >= 3) {
        return [...validPoints, validPoints[0]];
      }
    }
    return null;
  };

  const handleAddNew = () => {
    setFormData({
      AgencyName: '',
      mobileNumber: '',
      password: '',
      eventResponsibleFor: '',
      locationType: 'location',
      latitude: '',
      longitude: '',
      jurisdictionPoints: [
        { lat: '', lng: '' },
        { lat: '', lng: '' },
        { lat: '', lng: '' },
        { lat: '', lng: '' },
        { lat: '', lng: '' }
      ]
    });
    setEditMode(false);
    setView('form');
    setError('');
    setSuccess('');
  };

  const handleEdit = (agency) => {
    const hasJurisdiction = agency.jurisdiction && agency.jurisdiction.coordinates;
    setFormData({
      ...agency,
      eventResponsibleFor: agency.eventResponsibleFor.join(', '),
      locationType: hasJurisdiction ? 'jurisdiction' : 'location',
      latitude: agency.location?.latitude || '',
      longitude: agency.location?.longitude || '',
      jurisdictionPoints: hasJurisdiction
        ? agency.jurisdiction.coordinates[0].slice(0, 5).map(coord => ({ lat: coord[1], lng: coord[0] }))
        : [{ lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }]
    });
    setSelectedAgency(agency);
    setEditMode(true);
    setView('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (agencyId) => {
    if (!window.confirm('Are you sure you want to delete this agency?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.delete(`/backend/agencies/${agencyId}`);
      if (response.data.success) {
        setSuccess('Agency deleted successfully');
        await fetchAgencies();
      } else {
        setError('Failed to delete agency');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting agency');
      console.error('Error deleting agency:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.AgencyName.trim()) {
      setError('Agency name is required');
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      setError('Mobile number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError('Mobile number must be 10 digits');
      return false;
    }
    if (!editMode && !formData.password.trim()) {
      setError('Password is required');
      return false;
    }

    if (formData.locationType === 'location') {
      if (!formData.latitude || !formData.longitude) {
        setError('Latitude and longitude are required for location type');
        return false;
      }
    } else {
      const validPoints = formData.jurisdictionPoints.filter(p => p.lat && p.lng);
      if (validPoints.length < 3) {
        setError('At least 3 jurisdiction points are required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        AgencyName: formData.AgencyName,
        mobileNumber: formData.mobileNumber,
        eventResponsibleFor: formData.eventResponsibleFor.split(',').map(e => e.trim()).filter(e => e)
      };

      // Add password only for creation or if it's being changed
      if (!editMode || formData.password.trim()) {
        payload.password = formData.password;
      }

      if (formData.locationType === 'location') {
        payload.lat = parseFloat(formData.latitude);
        payload.lng = parseFloat(formData.longitude);
      } else {
        const coords = formData.jurisdictionPoints
          .filter(p => p.lat && p.lng)
          .map(p => [parseFloat(p.lng), parseFloat(p.lat)]); // [lng, lat] for GeoJSON
        
        if (coords.length >= 3) {
          coords.push(coords[0]); // Close the polygon
          payload.jurisdiction = {
            type: "Polygon",
            coordinates: [coords]
          };
        }
      }

      let response;
      if (editMode) {
        response = await api.put(`/backend/agencies/${selectedAgency.AgencyId}`, payload);
      } else {
        response = await api.post('/backend/agency', payload);
      }

      if (response.data.success) {
        setSuccess(editMode ? 'Agency updated successfully' : 'Agency created successfully');
        await fetchAgencies();
        setTimeout(() => {
          setView('list');
        }, 1500);
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error ${editMode ? 'updating' : 'creating'} agency`);
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (agency) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.put(`/backend/agencies/${agency.AgencyId}`, {
        password: newPassword
      });
      
      if (response.data.success) {
        setSuccess('Password changed successfully');
        await fetchAgencies();
      } else {
        setError('Failed to change password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (agencyId) => {
    setShowPassword(prev => ({ ...prev, [agencyId]: !prev[agencyId] }));
  };

  const handleViewOnMap = (agency) => {
    if (agency.location) {
      setMapCenter([agency.location.latitude, agency.location.longitude]);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileUploadError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'json' || fileExtension === 'geojson') {
          handleJSONUpload(content);
        } else if (fileExtension === 'csv') {
          handleCSVUpload(content);
        } else {
          setFileUploadError('Unsupported file format. Please upload GeoJSON, JSON, or CSV.');
        }
      } catch (error) {
        setFileUploadError('Error reading file: ' + error.message);
      }
    };

    reader.onerror = () => {
      setFileUploadError('Error reading file');
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleJSONUpload = (content) => {
    try {
      const data = JSON.parse(content);

      // Check if it's GeoJSON
      if (data.type === 'FeatureCollection' && data.features) {
        const feature = data.features[0];
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0].map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
          
          if (coords.length >= 5) {
            setFormData({
              ...formData,
              locationType: 'jurisdiction',
              jurisdictionPoints: coords.slice(0, 5)
            });
          } else {
            setFileUploadError('Polygon must have at least 5 points');
          }
        } else if (feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          setFormData({
            ...formData,
            locationType: 'location',
            latitude: lat.toString(),
            longitude: lng.toString()
          });
        }
      }
      // Check if it's a simple JSON with location
      else if (data.latitude && data.longitude) {
        setFormData({
          ...formData,
          locationType: 'location',
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString()
        });
      }
      // Check if it's JSON with jurisdiction coordinates
      else if (data.coordinates && Array.isArray(data.coordinates)) {
        const coords = data.coordinates.map(coord => ({
          lat: coord[0] || coord.lat || '',
          lng: coord[1] || coord.lng || coord.lon || ''
        }));
        
        if (coords.length >= 3) {
          const paddedCoords = [...coords];
          while (paddedCoords.length < 5) {
            paddedCoords.push({ lat: '', lng: '' });
          }
          
          setFormData({
            ...formData,
            locationType: 'jurisdiction',
            jurisdictionPoints: paddedCoords.slice(0, 5)
          });
        } else {
          setFileUploadError('Need at least 3 coordinate points for jurisdiction');
        }
      } else {
        setFileUploadError('Invalid JSON format. Expected GeoJSON or {latitude, longitude} or {coordinates: [...]}');
      }
    } catch (error) {
      setFileUploadError('Invalid JSON format: ' + error.message);
    }
  };

  const handleCSVUpload = (content) => {
    try {
      const lines = content.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      // Check if it's a single location CSV
      if (headers.includes('latitude') && headers.includes('longitude')) {
        const values = lines[1].split(',').map(v => v.trim());
        const latIndex = headers.indexOf('latitude');
        const lngIndex = headers.indexOf('longitude');
        
        setFormData({
          ...formData,
          locationType: 'location',
          latitude: values[latIndex],
          longitude: values[lngIndex]
        });
      }
      // Check if it's jurisdiction coordinates CSV
      else if ((headers.includes('lat') || headers.includes('latitude')) && 
               (headers.includes('lng') || headers.includes('lon') || headers.includes('longitude'))) {
        const latHeader = headers.find(h => h === 'lat' || h === 'latitude');
        const lngHeader = headers.find(h => h === 'lng' || h === 'lon' || h === 'longitude');
        const latIndex = headers.indexOf(latHeader);
        const lngIndex = headers.indexOf(lngHeader);
        
        const coords = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            lat: values[latIndex] || '',
            lng: values[lngIndex] || ''
          };
        }).filter(coord => coord.lat && coord.lng);
        
        if (coords.length >= 3) {
          const paddedCoords = [...coords];
          while (paddedCoords.length < 5) {
            paddedCoords.push({ lat: '', lng: '' });
          }
          
          setFormData({
            ...formData,
            locationType: 'jurisdiction',
            jurisdictionPoints: paddedCoords.slice(0, 5)
          });
        } else {
          setFileUploadError('Need at least 3 coordinate points for jurisdiction');
        }
      } else {
        setFileUploadError('CSV must have latitude/longitude or lat/lng columns');
      }
    } catch (error) {
      setFileUploadError('Error parsing CSV: ' + error.message);
    }
  };

  // Notification component
  const Notification = ({ type, message }) => {
    if (!message) return null;
    
    return (
      <div className={`fixed top-4 right-4 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
        type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
      }`}>
        <AlertCircle size={18} />
        <span className="text-sm font-medium">{message}</span>
      </div>
    );
  };

  if (view === 'form') {
    const previewCenter = getPreviewMapCenter();
    const previewPolygon = getPreviewPolygonCoords();
    
    return (
      <div className="h-screen flex flex-col bg-linear-to-br from-sky-100 via-cyan-50 to-blue-100 overflow-hidden">
        <Notification type="error" message={error} />
        <Notification type="success" message={success} />
        
        {/* Header */}
        <div className="bg-sky-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/omnivision-logo.png" 
                  alt="OmniVision Logo" 
                  className="h-14 w-auto"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <p className="text-3xl mt-2 font-bold text-neutral-700">
                  {editMode ? 'Edit Agency' : 'Add New Agency'}
                </p>
              </div>
              <div
                onClick={() => setView('list')}
                className="px-3 py-2 cursor-pointer bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all font-medium text-sm"
              >
                Back to List
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 py-2 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
              {/* Form Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
                <div className="bg-sky-300 px-3 py-2">
                  <p className="text-2xl font-bold text-sky-800">Agency Details</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Agency Name *</label>
                      <input
                        type="text"
                        value={formData.AgencyName}
                        onChange={(e) => setFormData({ ...formData, AgencyName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder="Enter agency name"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Password {editMode && '(leave blank to keep current)'}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        placeholder={editMode ? "Leave blank to keep current password" : "Enter password"}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Events Responsible For</label>
                      <input
                        type="text"
                        value={formData.eventResponsibleFor}
                        onChange={(e) => setFormData({ ...formData, eventResponsibleFor: e.target.value })}
                        placeholder="e.g., Road Damage, Street Light"
                        className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">Separate multiple events with commas</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Location Type *</label>
                      <div className="flex gap-2">
                        <label className="flex items-center cursor-pointer bg-sky-50 px-2.5 py-1.5 rounded-md border border-sky-300 hover:bg-sky-100 transition-all flex-1">
                          <input
                            type="radio"
                            value="location"
                            checked={formData.locationType === 'location'}
                            onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                            className="mr-1.5 w-3 h-3 accent-sky-500"
                            disabled={loading}
                          />
                          <span className="text-xs font-medium text-gray-700">Single Location</span>
                        </label>
                        <label className="flex items-center cursor-pointer bg-sky-50 px-2.5 py-1.5 rounded-md border border-sky-300 hover:bg-sky-100 transition-all flex-1">
                          <input
                            type="radio"
                            value="jurisdiction"
                            checked={formData.locationType === 'jurisdiction'}
                            onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                            className="mr-1.5 w-3 h-3 accent-sky-500"
                            disabled={loading}
                          />
                          <span className="text-xs font-medium text-gray-700">Jurisdiction</span>
                        </label>
                      </div>
                    </div>

                    {formData.locationType === 'location' ? (
                      <>
                        <div className="bg-sky-50 border border-sky-200 mt-2 rounded-md p-2">
                          <div className="flex items-start gap-2 mb-2">
                            <Upload size={16} className="text-sky-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-800 mb-0.5 text-xs">Import from File</h5>
                              <p className="text-xs text-gray-600 mb-1.5">Upload GeoJSON, JSON, or CSV</p>
                              <input
                                type="file"
                                accept=".json,.geojson,.csv"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 file:cursor-pointer cursor-pointer"
                                disabled={loading}
                              />
                              {fileUploadError && (
                                <p className="text-xs text-red-600 mt-1 font-medium">{fileUploadError}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5 pl-5">
                            <p className="font-semibold text-gray-700">Formats:</p>
                            <p>• JSON: {`{"latitude": 20.29, "longitude": 85.82}`}</p>
                            <p>• CSV: latitude,longitude headers</p>
                          </div>
                        </div>
                        
                        <div className="text-center text-xs font-medium text-gray-500 my-1">OR</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude *</label>
                            <input
                              type="number"
                              step="any"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                              placeholder="20.2961"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude *</label>
                            <input
                              type="number"
                              step="any"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-all bg-white text-sm"
                              placeholder="85.8245"
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-sky-50 border border-sky-200 rounded-md mt-2 p-2">
                          <div className="flex items-start gap-2 mb-2">
                            <Upload size={16} className="text-sky-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-800 mb-0.5 text-xs">Import from File</h5>
                              <p className="text-xs text-gray-600 mb-1.5">Upload polygon coordinates</p>
                              <input
                                type="file"
                                accept=".json,.geojson,.csv"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 file:cursor-pointer cursor-pointer"
                                disabled={loading}
                              />
                              {fileUploadError && (
                                <p className="text-xs text-red-600 mt-1 font-medium">{fileUploadError}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5 pl-5">
                            <p className="font-semibold text-gray-700">Formats:</p>
                            <p>• JSON: {`{"coordinates": [[lat, lng], ...]}`}</p>
                            <p>• CSV: lat/lng columns with multiple rows</p>
                          </div>
                        </div>
                        
                        <div className="text-center text-xs font-medium text-gray-500 my-1">OR</div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Jurisdiction Points (minimum 3 points) *</label>
                          <div className="space-y-1.5">
                            {formData.jurisdictionPoints.map((point, index) => (
                              <div key={index} className="grid grid-cols-2 mb-1 gap-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder={`Point ${index + 1} Lat`}
                                  value={point.lat}
                                  onChange={(e) => {
                                    const newPoints = [...formData.jurisdictionPoints];
                                    newPoints[index].lat = e.target.value;
                                    setFormData({ ...formData, jurisdictionPoints: newPoints });
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
                                    const newPoints = [...formData.jurisdictionPoints];
                                    newPoints[index].lng = e.target.value;
                                    setFormData({ ...formData, jurisdictionPoints: newPoints });
                                  }}
                                  className="px-2 py-1 border border-sky-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs transition-all"
                                  disabled={loading}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

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
                            {editMode ? 'Update' : 'Create'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setView('list')}
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

              {/* Map Preview Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
                <div className="bg-sky-300 px-3 py-2 flex items-center gap-1.5">
                  <MapPin size={18} className="text-sky-800" />
                  <h4 className="text-base font-bold text-sky-800">Location Preview</h4>
                </div>
                <div className="flex-1 p-2">
                  <div className="rounded-lg overflow-hidden border-2 border-sky-200 h-full">
                    <MapContainer
                      center={previewCenter}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapUpdater center={previewCenter} />
                      
                      {formData.locationType === 'location' && formData.latitude && formData.longitude && (
                        <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}>
                          <Popup>
                            <div className="text-center">
                              <strong className="text-sky-700">{formData.AgencyName || 'New Agency'}</strong>
                              <br />
                              <span className="text-xs text-gray-600">Location Point</span>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      
                      {formData.locationType === 'jurisdiction' && previewPolygon && previewPolygon.length >= 4 && (
                        <Polygon
                          positions={previewPolygon}
                          pathOptions={{ color: '#0284c7', fillColor: '#7dd3fc', fillOpacity: 0.4 }}
                        >
                          <Popup>
                            <div className="text-center">
                              <strong className="text-sky-700">{formData.AgencyName || 'New Agency'}</strong>
                              <br />
                              <span className="text-xs text-gray-600">Jurisdiction Area</span>
                            </div>
                          </Popup>
                        </Polygon>
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-sky-100 via-cyan-50 to-blue-100 flex flex-col">
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
                onError={(e) => e.target.style.display = 'none'}
              />
              <p className="mt-2 font-bold text-3xl text-neutral-700">Agency Management</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAgencies}
                disabled={loading}
                className="px-3 py-2 bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all flex items-center gap-1.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <div
                onClick={handleAddNew}
                className="px-3 py-2 cursor-pointer bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-all flex items-center gap-1.5 font-medium text-sm"
              >
                <Plus size={18} />
                Add Agency
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-3 py-2 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
            {/* Agencies List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
              <div className="bg-sky-300 px-3 py-1 flex items-center justify-between">
                <p className="text-2xl font-bold text-sky-800">Agencies List</p>
                <span className="text-sm text-sky-700 font-medium">
                  {agencies.length} {agencies.length === 1 ? 'agency' : 'agencies'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {loading && agencies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw size={32} className="animate-spin text-sky-500 mx-auto mb-2" />
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
                            <p className="text-xs text-gray-600">ID: {agency.AgencyId}</p>
                            <p className="text-xs text-gray-600">📱 {agency.mobileNumber}</p>
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
                        
                        <div className="mb-2 pb-2 border-b border-sky-100">
                          <p className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-700">Password:</span>
                            <span className="font-mono text-gray-800 bg-sky-50 px-1.5 py-0.5 rounded text-xs">
                              {showPassword[agency.AgencyId] ? agency.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(agency.AgencyId)}
                              className="text-sky-600 hover:text-sky-700 transition-colors"
                            >
                              {showPassword[agency.AgencyId] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              onClick={() => handleChangePassword(agency)}
                              disabled={loading}
                              className="text-xs text-sky-600 hover:underline font-semibold disabled:opacity-50"
                            >
                              Change
                            </button>
                          </p>
                        </div>

                        <div className="mb-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Events:</p>
                          {agency.eventResponsibleFor && agency.eventResponsibleFor.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {agency.eventResponsibleFor.map((event, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-medium"
                                >
                                  {event}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No events assigned</span>
                          )}
                        </div>

                        <div className="text-xs">
                          <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <MapPin size={14} className="text-sky-600" />
                            {agency.type === 'jurisdiction' ? 'Jurisdiction Area' : 'Location Point'}
                          </p>
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

            {/* Map View */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-sky-200 overflow-hidden flex flex-col">
              <div className="bg-sky-300 px-3 py-2 flex items-center gap-1.5">
                <MapPin size={18} className="text-sky-800" />
                <h3 className="text-base font-bold text-sky-800">Map View</h3>
              </div>
              <div className="flex-1 p-2">
                <div className="h-full rounded-lg overflow-hidden border-2 border-sky-200">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} />
                    
                    {agencies.map((agency) => (
                      <React.Fragment key={agency._id}>
                        {agency.jurisdiction && agency.jurisdiction.coordinates ? (
                          <Polygon
                            positions={agency.jurisdiction.coordinates[0].map(coord => [coord[1], coord[0]])}
                            pathOptions={{ color: '#0284c7', fillColor: '#7dd3fc', fillOpacity: 0.4 }}
                          >
                            <Popup>
                              <div>
                                <strong className="text-sky-700">{agency.AgencyName}</strong>
                                <br />
                                <span className="text-xs text-gray-600">Jurisdiction Area</span>
                                <br />
                                <span className="text-xs text-gray-600">📱 {agency.mobileNumber}</span>
                              </div>
                            </Popup>
                          </Polygon>
                        ) : (
                          agency.location && (
                            <Marker position={[agency.location.latitude, agency.location.longitude]}>
                              <Popup>
                                <div>
                                  <strong className="text-sky-700">{agency.AgencyName}</strong>
                                  <br />
                                  <span className="text-xs text-gray-600">📱 {agency.mobileNumber}</span>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        )}
                      </React.Fragment>
                    ))}
                  </MapContainer>
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