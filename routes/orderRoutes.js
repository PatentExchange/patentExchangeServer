const express = require("express");
const {addOrders,getUserOrders,getOrderedPatents} = require("../controllers/orderController");

const router = express.Router();

router.post("/create-order",addOrders);
router.post("/get-my-orders",getUserOrders);
router.post("/get-ordered-patents",getOrderedPatents);
module.exports = router;