const express = require("express");
const {addOrders} = require("../controllers/orderController");

const router = express.Router();

router.post("/create-order",addOrders);

module.exports = router;