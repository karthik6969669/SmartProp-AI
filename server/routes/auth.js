const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Register route
router.post("/register", registerUser);

// Email verification route
router.get("/verify", verifyUser);

// Login route
router.post("/login", loginUser);

// Forgot password route to request reset email
router.post("/forgot-password", forgotPassword);

// Reset password route to set new password
router.post("/reset-password", resetPassword);

module.exports = router;
