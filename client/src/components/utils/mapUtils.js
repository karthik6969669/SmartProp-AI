// client/src/utils/mapUtils.js
export async function fetchLocationDetails(lat, lng) {
  const response = await fetch(`/api/location-details?lat=${lat}&lng=${lng}`);
  return await response.json();
}
