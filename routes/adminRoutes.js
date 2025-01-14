const express = require("express");
const {adminDashboardDetails} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard-details",adminDashboardDetails);

module.exports = router;