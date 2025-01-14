const express = require("express");
const {adminDashboardDetails,updateUser,suspendUser} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard-details",adminDashboardDetails);
router.put("/update-user",updateUser);
router.put("/suspend-user",suspendUser);

module.exports = router;