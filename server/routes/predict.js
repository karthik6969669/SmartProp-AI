const express = require("express");
const router = express.Router();
const { predictHouse, predictLand } = require("../controllers/predictionController");

router.post("/house", predictHouse);
router.post("/land", predictLand);

module.exports = router;
