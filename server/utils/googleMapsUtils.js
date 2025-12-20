const fetch = require("node-fetch");

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function fetchLocationDetails(lat, lng) {
  // Geocoding API call
  const geocodeRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );
  const geocodeData = await geocodeRes.json();
  const location = geocodeData.results?.[0]?.formatted_address || "";

  const placeTypes = {
    hospital: "hospital",
    school: "school",
    railway: "train_station",
    bus: "bus_station",
  };

  let placeDetails = {};
  for (const [key, type] of Object.entries(placeTypes)) {
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${API_KEY}`
    );
    const placesData = await placesRes.json();
    placeDetails[key] = placesData.results?.[0] || null;
  }

  const destinations = Object.values(placeDetails)
    .filter((p) => p !== null)
    .map((p) => `${p.geometry.location.lat},${p.geometry.location.lng}`)
    .join("|");

  const distanceRes = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${destinations}&key=${API_KEY}`
  );
  const distanceData = await distanceRes.json();

  let distances = {};
  if (distanceData.rows?.length && distanceData.rows[0].elements.length) {
    let i = 0;
    for (const key of Object.keys(placeTypes)) {
      if (placeDetails[key]) {
        distances[key + "Applicable"] = "applicable";
        distances[key + "Distance"] = distanceData.rows[0].elements[i].distance.value / 1000; // km
        i++;
      } else {
        distances[key + "Applicable"] = "notApplicable";
        distances[key + "Distance"] = 0;
      }
    }
  }

  return { location, latitude: lat, longitude: lng, ...distances };
}

module.exports = { fetchLocationDetails };
