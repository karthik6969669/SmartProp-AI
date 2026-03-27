require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (FIRST)
app.use(cors());
app.use(express.json());

// Routes
const locationRoutes = require('./routes/location');
const predictRoutes = require("./routes/predict");
const authRoutes = require("./routes/auth");

// Use routes (CONSISTENT API)
app.use('/api/location', locationRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/auth', authRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("SmartProp Backend is Running 🚀");
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});