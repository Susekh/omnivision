
// // MapCanvas.js


// // MapCanvas.js
// import React, { useEffect, useRef } from "react";
// import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

// const containerStyle = {
//   width: "100%",
//   height: "300px",
// };

// // ✅ FIX: move libraries outside the component
// const libraries = ['marker'];

// function MapCanvas({ coordinates }) {
//   const { isLoaded } = useJsApiLoader({
//     //googleMapsApiKey: "AIzaSyD1r7v2X0xk4bq3g5c6j8z9l1Z5Y2Qe4wE",
//     googleMapsApiKey: "AIzaSyDvcjPnTtV0vF8A43Ofwgp4oLtUeJXs8Mo" // Replace with your API key  libraries,
//   });

//   const mapRef = useRef(null);
//   const markerRef = useRef(null);

//   useEffect(() => {
//     if (isLoaded && coordinates && mapRef.current) {
//       if (markerRef.current) {
//         markerRef.current.map = null;
//       }

//       markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
//         position: coordinates,
//         map: mapRef.current,
//         title: "Advanced Marker",
//       });
//     }
//   }, [isLoaded, coordinates]);

//   return isLoaded && coordinates ? (
//     <GoogleMap
//       mapContainerStyle={containerStyle}
//       center={coordinates}
//       zoom={15}
//       onLoad={(map) => (mapRef.current = map)}
//     />
//   ) : null;
// }

// export default MapCanvas;


import React, { useEffect, useState } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  useGoogleMap,
} from '@react-google-maps/api';

const FlyToLocation = ({ location }) => {
  const map = useGoogleMap();
  useEffect(() => {
    if (location && map) {
      map.panTo({ lat: location[0], lng: location[1] });
      map.setZoom(17);
    }
  }, [location, map]);
  return null;
};

const ZoomToLocationMap = ({ location }) => {
  const [activeInfo, setActiveInfo] = useState(null);

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        center={{ lat: 20.2961, lng: 85.8245 }}
        zoom={13}
        mapContainerStyle={{ height: '400px', width: '100%' }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {location && <FlyToLocation location={location} />}

        {location && (
          <Marker
            position={{ lat: location[0], lng: location[1] }}
            onClick={() =>
              setActiveInfo({
                position: { lat: location[0], lng: location[1] },
              })
            }
          />
        )}

        {activeInfo && (
          <InfoWindow
            position={activeInfo.position}
            onCloseClick={() => setActiveInfo(null)}
          >
            Selected Location
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default ZoomToLocationMap;