require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const locationRoutes = require('./routes/location');
app.use('/api', locationRoutes);


// Middleware to parse JSON requests - must be before routes
app.use(express.json());

// Enable CORS
app.use(cors());


// Import routes
const predictRoutes = require("./routes/predict");
const authRoutes = require("./routes/auth");

// Use routes
app.use("/predict", predictRoutes);
app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.send('SmartProp AI Backend is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
