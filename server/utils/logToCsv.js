const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const ensureFile = async (filePath, headers) => {
  if (!fs.existsSync(filePath)) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
      append: false,
    });
    await csvWriter.writeRecords([]); // IMPORTANT: await here to create file with headers
  }
};

exports.logHousePrediction = async (data) => {
const filePath = path.join(__dirname, '../../ml/data/house_price_predictions.csv');
  const headers = [
    { id: 'location', title: 'Location' },
    { id: 'area', title: 'Area_sqft' },
    { id: 'type', title: 'Property_Type' },
    { id: 'bedrooms', title: 'Bedrooms' },
    { id: 'bathrooms', title: 'Bathrooms' },
    { id: 'year', title: 'Year_Built' },
    { id: 'condition', title: 'Condition' },
    { id: 'hospital_applicable', title: 'Hospital_Applicable' },
    { id: 'hospital_distance', title: 'Hospital_Distance_km' },
    { id: 'school_applicable', title: 'School_Applicable' },
    { id: 'school_distance', title: 'School_Distance_km' },
    { id: 'railway_applicable', title: 'Railway_Applicable' },
    { id: 'railway_distance', title: 'Railway_Distance_km' },
    { id: 'bus_applicable', title: 'Bus_Applicable' },
    { id: 'bus_distance', title: 'Bus_Distance_km' },
    { id: 'latitude', title: 'Latitude' },
    { id: 'longitude', title: 'Longitude' },
    { id: 'predicted_price', title: 'Predicted_Price' },
    { id: 'date', title: 'Date' },
  ];
  await ensureFile(filePath, headers);

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: true,
  });
  await csvWriter.writeRecords([data]);
};

exports.logLandPrediction = async (data) => {
  const filePath = path.join(__dirname, '../../ml/data/land_price_predictions.csv');
  const headers = [
    { id: 'location', title: 'Location' },
    { id: 'area', title: 'Area_acres' },
    { id: 'zoning', title: 'Zoning_Type' },
    { id: 'water_applicable', title: 'Water_Service_Applicable' },
    { id: 'water_distance', title: 'Water_Service_Distance_km' },
    { id: 'road_applicable', title: 'Road_Access_Applicable' },
    { id: 'road_distance', title: 'Road_Access_Distance_km' },
    { id: 'school_applicable', title: 'School_Applicable' },
    { id: 'school_distance', title: 'School_Distance_km' },
    { id: 'railway_applicable', title: 'Railway_Applicable' },
    { id: 'railway_distance', title: 'Railway_Distance_km' },
    { id: 'bus_applicable', title: 'Bus_Applicable' },
    { id: 'bus_distance', title: 'Bus_Distance_km' },
    { id: 'latitude', title: 'Latitude' },
    { id: 'longitude', title: 'Longitude' },
    { id: 'predicted_price', title: 'Predicted_Price' },
    { id: 'date', title: 'Date' },
  ];
  await ensureFile(filePath, headers);

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: true,
  });
  await csvWriter.writeRecords([data]);
};
