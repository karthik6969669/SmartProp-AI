const { logHousePrediction, logLandPrediction } = require("../utils/logToCsv");

// Dummy house price prediction logic (replace with your ML/model)
function mockHousePrice(data) {
  return 1000 + (parseInt(data.area) || 0) * 15 + (parseInt(data.bedrooms) || 0) * 50000;
}

// Dummy land price prediction logic (replace with your ML/model)
function mockLandPrice(data) {
  return 800 + (parseFloat(data.area) || 0) * 12 + (data.zoning === "Commercial" ? 200000 : 0);
}

exports.predictHouse = async (req, res) => {
  try {
    const price = mockHousePrice(req.body);

    await logHousePrediction({
      location: req.body.location,
      area: req.body.area,
      type: req.body.propertyType,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      year: req.body.year,
      condition: req.body.condition,
      hospital_applicable: req.body.hospitalApplicable,
      hospital_distance: req.body.hospitalDistance,
      school_applicable: req.body.schoolApplicable,
      school_distance: req.body.schoolDistance,
      railway_applicable: req.body.railwayApplicable,
      railway_distance: req.body.railwayDistance,
      bus_applicable: req.body.busApplicable,
      bus_distance: req.body.busDistance,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      predicted_price: price,
      date: new Date().toISOString(),
    });

    res.json({ price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Prediction failed." });
  }
};

exports.predictLand = async (req, res) => {
  try {
    const price = mockLandPrice(req.body);

    await logLandPrediction({
      location: req.body.location,
      area: req.body.area,
      zoning: req.body.zoning,
      water_applicable: req.body.waterApplicable,
      water_distance: req.body.waterDistance,
      road_applicable: req.body.roadApplicable,
      road_distance: req.body.roadDistance,
      school_applicable: req.body.schoolApplicable,
      school_distance: req.body.schoolDistance,
      railway_applicable: req.body.railwayApplicable,
      railway_distance: req.body.railwayDistance,
      bus_applicable: req.body.busApplicable,
      bus_distance: req.body.busDistance,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      predicted_price: price,
      date: new Date().toISOString(),
    });

    res.json({ price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Prediction failed." });
  }
};
