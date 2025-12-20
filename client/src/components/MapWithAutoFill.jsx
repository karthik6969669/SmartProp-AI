import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { fetchLocationDetails } from "./utils/mapUtils"; // Adjust path based on your structure

const containerStyle = { width: "100%", height: "400px" };

export default function MapWithAutoFill({ initialLat, initialLng, onAutoFill }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const defaultLat = 11.0168;
  const defaultLng = 76.9558;

  const [markerPos, setMarkerPos] = useState({
    lat: Number(initialLat) || defaultLat,
    lng: Number(initialLng) || defaultLng,
  });

  const handleMapClick = async (e) => {
    const lat = Number(e.latLng.lat());
    const lng = Number(e.latLng.lng());
    setMarkerPos({ lat, lng });

    // Fetch full location info and nearby distances from backend API util
    try {
      const formData = await fetchLocationDetails(lat, lng);

      // Pass this data back to parent for autofill of all form fields
      onAutoFill(formData);
    } catch (error) {
      console.error("Failed to fetch location details:", error);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPos}
      zoom={15}
      onClick={handleMapClick}
    >
      <Marker position={markerPos} />
    </GoogleMap>
  );
}
