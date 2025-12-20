import React from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "400px",
  height: "300px",
};

const libraries = ["places"];

export default function MapComponent({ lat, lng, onLocationSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const center =
    lat != null && lng != null
      ? { lat: Number(lat), lng: Number(lng) }
      : { lat: 9.512, lng: 77.634 }; // fallback center

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onClick={(e) => {
        if (!onLocationSelect) return;
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        onLocationSelect(newLat, newLng);
      }}
    >
      {lat != null && lng != null && (
        <Marker position={{ lat: Number(lat), lng: Number(lng) }} />
      )}
    </GoogleMap>
  );
}
