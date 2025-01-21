const express = require("express");
const {addTransfer,getTransfers,addToInterestedBuyers,getInterestedBuyers}=  require("../controllers/transferController");

const router = express.Router();

router.post("/add-transfer",addTransfer);
router.post("/get-transfers",getTransfers);
router.post("/add-to-interested-buyers",addToInterestedBuyers);
router.post("/get-interested-buyers",getInterestedBuyers);
module.exports=router;