import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import { Trash2, Edit2, Plus, Eye, EyeOff, Save, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Initial agency data
const initialAgencies = [
  {
    _id: "68494141fa7e1500079ec953",
    AgencyId: "agency-121",
    AgencyName: "City Maintenance",
    mobileNumber: "1234567892",
    password: "password123",
    location: { latitude: 20.27767900038015, longitude: 85.83477958751283 },
    eventResponsibleFor: ["Road Damage", "Environmental Violation", "Daytime Running Street Light"],
    jurisdiction: {
      coordinates: [[20.27, 85.83], [20.28, 85.83], [20.28, 85.84], [20.27, 85.84], [20.27, 85.83]],
      type: "Polygon"
    }
  },
  {
    _id: "68494141fa7e1500079ec954",
    AgencyId: "agency-125",
    AgencyName: "Kiims",
    mobileNumber: "8480750392",
    password: "kiims2024",
    location: { latitude: 20.27767900038015, longitude: 85.83477958751283 },
    eventResponsibleFor: ["Human healthcare services"]
  },
  {
    _id: "68494141fa7e1500079ec956",
    AgencyId: "agency-126",
    AgencyName: "SUM",
    mobileNumber: "9861374962",
    password: "sum2024",
    location: { latitude: 20.340294, longitude: 85.80871 },
    eventResponsibleFor: ["Human healthcare services"]
  },
  {
    _id: "685cd7cc48bf540007fa1f3c",
    AgencyId: "agency-122",
    AgencyName: "BMC",
    mobileNumber: "1234567890",
    password: "bmc2024",
    location: { latitude: 20.27767900038015, longitude: 85.83477958751283 },
    eventResponsibleFor: ["Road Damage", "Environmental Violation", "Daytime Running Street Light"],
    jurisdiction: {
      coordinates: [[20.27, 85.83], [20.28, 85.83], [20.28, 85.84], [20.27, 85.84], [20.27, 85.83]],
      type: "Polygon"
    }
  }
];

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const AdminAgencyManager = () => {
  const [agencies, setAgencies] = useState(initialAgencies);
  const [view, setView] = useState('list');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [mapCenter, setMapCenter] = useState([20.2961, 85.8245]);
  
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
        ? agency.jurisdiction.coordinates.slice(0, 5).map(coord => ({ lat: coord[0], lng: coord[1] }))
        : [{ lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }, { lat: '', lng: '' }]
    });
    setSelectedAgency(agency);
    setEditMode(true);
    setView('form');
  };

  const handleDelete = (agencyId) => {
    if (window.confirm('Are you sure you want to delete this agency?')) {
      setAgencies(agencies.filter(a => a._id !== agencyId));
    }
  };

  const handleSubmit = () => {
    const newAgency = {
      _id: editMode ? selectedAgency._id : Date.now().toString(),
      AgencyId: editMode ? selectedAgency.AgencyId : `agency-${Math.floor(Math.random() * 1000)}`,
      AgencyName: formData.AgencyName,
      mobileNumber: formData.mobileNumber,
      password: formData.password,
      eventResponsibleFor: formData.eventResponsibleFor.split(',').map(e => e.trim()),
    };

    if (formData.locationType === 'location') {
      newAgency.location = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
    } else {
      const coords = formData.jurisdictionPoints
        .filter(p => p.lat && p.lng)
        .map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
      
      if (coords.length >= 3) {
        coords.push(coords[0]); // Close the polygon
        newAgency.jurisdiction = {
          coordinates: coords,
          type: "Polygon"
        };
        
        // Calculate center for location
        const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        newAgency.location = { latitude: avgLat, longitude: avgLng };
      }
    }

    if (editMode) {
      setAgencies(agencies.map(a => a._id === selectedAgency._id ? newAgency : a));
    } else {
      setAgencies([...agencies, newAgency]);
    }
    
    setView('list');
  };

  const handleChangePassword = (agency) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
      setAgencies(agencies.map(a => 
        a._id === agency._id ? { ...a, password: newPassword } : a
      ));
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

  if (view === 'form') {
    const previewCenter = getPreviewMapCenter();
    const previewPolygon = getPreviewPolygonCoords();
    
    return (
      <div className="max-h-7xl overflow-scroll bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-2 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editMode ? 'Edit Agency' : 'Add New Agency'}
              </h2>
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to List
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Form Section */}
            <div className="bg-white rounded-lg max-h-2/3 overflow-y-scroll p-2 shadow-md">
              <h4 className="text-lg font-semibold text-gray-800  mb-4">Agency Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    value={formData.AgencyName}
                    onChange={(e) => setFormData({ ...formData, AgencyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter agency name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Events Responsible For (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={formData.eventResponsibleFor}
                    onChange={(e) => setFormData({ ...formData, eventResponsibleFor: e.target.value })}
                    placeholder="e.g., Road Damage, Street Light Issues"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="location"
                        checked={formData.locationType === 'location'}
                        onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm">Single Location</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="jurisdiction"
                        checked={formData.locationType === 'jurisdiction'}
                        onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm">Jurisdiction (Polygon)</span>
                    </label>
                  </div>
                </div>

                {formData.locationType === 'location' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="20.2961"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="85.8245"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jurisdiction Points (5 points to form polygon) *
                    </label>
                    <div className="space-y-3">
                      {formData.jurisdictionPoints.map((point, index) => (
                        <div key={index} className="grid grid-cols-2 mb-2 gap-3">
                          <input
                            type="number"
                            step="any"
                            placeholder={`Point ${index + 1} Latitude`}
                            value={point.lat}
                            onChange={(e) => {
                              const newPoints = [...formData.jurisdictionPoints];
                              newPoints[index].lat = e.target.value;
                              setFormData({ ...formData, jurisdictionPoints: newPoints });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder={`Point ${index + 1} Longitude`}
                            value={point.lng}
                            onChange={(e) => {
                              const newPoints = [...formData.jurisdictionPoints];
                              newPoints[index].lng = e.target.value;
                              setFormData({ ...formData, jurisdictionPoints: newPoints });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Save size={18} />
                    {editMode ? 'Update Agency' : 'Create Agency'}
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Map Preview Section */}
            <div className="bg-white rounded-lg shadow-md p-2">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Location Preview</h4>
              <div className="h-150 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={previewCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater center={previewCenter} />
                  
                  {formData.locationType === 'location' && formData.latitude && formData.longitude && (
                    <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}>
                      <Popup>
                        <div>
                          <strong>{formData.AgencyName || 'New Agency'}</strong>
                          <br />
                          Location Point
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {formData.locationType === 'jurisdiction' && previewPolygon && previewPolygon.length >= 4 && (
                    <Polygon
                      positions={previewPolygon}
                      pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.3 }}
                    >
                      <Popup>
                        <div>
                          <strong>{formData.AgencyName || 'New Agency'}</strong>
                          <br />
                          Jurisdiction Area
                        </div>
                      </Popup>
                    </Polygon>
                  )}
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.locationType === 'location' 
                  ? 'Enter latitude and longitude to see the marker on the map'
                  : 'Enter at least 3 points to see the jurisdiction polygon on the map'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex justify-between p-2 items-center">
            <h2 className="font-bold text-2xl text-gray-800">Agency Management</h2>
            <button
              onClick={handleAddNew}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              Add Agency
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Agencies List */}
          <div
  className="bg-white rounded-xl shadow-sm p-4"
  style={{ maxHeight: "calc(100vh - 1px)" }}
>

            <p className="text-2xl font-semibold mb-4 text-gray-800">Agencies List</p>
            <div className="space-y-3 max-h-3/4 overflow-y-scroll pr-2">
              {agencies.map((agency) => (
                <div
                  key={agency._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {agency.AgencyName}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {agency.AgencyId}</p>
                      <p className="text-sm text-gray-600">Mobile: {agency.mobileNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(agency)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(agency._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                      <span className="font-medium">Password:</span>
                      <span className="font-mono text-gray-800">
                        {showPassword[agency._id] ? agency.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(agency._id)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword[agency._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleChangePassword(agency)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Change
                      </button>
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {agency.eventResponsibleFor.map((event, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium text-gray-700 mb-1">
                      {agency.jurisdiction ? '📍 Jurisdiction Area' : '📍 Location Point'}
                    </p>
                    <button
                      onClick={() => handleViewOnMap(agency)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View on Map →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map View */}
          <div className="bg-white rounded-lg shadow-md p-2">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Map View</h3>
            <div className="h-175 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapCenter} />
                
                {agencies.map((agency) => (
                  <React.Fragment key={agency._id}>
                    {agency.jurisdiction ? (
                      <Polygon
                        positions={agency.jurisdiction.coordinates.map(coord => [coord[0], coord[1]])}
                        pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.3 }}
                      >
                        <Popup>
                          <div className="p-1">
                            <strong className="text-base">{agency.AgencyName}</strong>
                            <br />
                            <span className="text-sm text-gray-600">Jurisdiction Area</span>
                            <br />
                            <span className="text-sm text-gray-600">{agency.mobileNumber}</span>
                          </div>
                        </Popup>
                      </Polygon>
                    ) : (
                      agency.location && (
                        <Marker position={[agency.location.latitude, agency.location.longitude]}>
                          <Popup>
                            <div className="p-1">
                              <strong className="text-base">{agency.AgencyName}</strong>
                              <br />
                              <span className="text-sm text-gray-600">{agency.mobileNumber}</span>
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
  );
};

export default AdminAgencyManager;