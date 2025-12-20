const express = require("express");
const router = express.Router();
const { fetchLocationDetails } = require("../utils/googleMapsUtils");

router.get("/location-details", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

  try {
    const data = await fetchLocationDetails(lat, lng);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch location details" });
  }
});

module.exports = router;
