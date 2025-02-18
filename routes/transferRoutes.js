const express = require("express");
const {removeBuyer,addTransfer,updateBuyersStatus,getTransfers,addToInterestedBuyers,getInterestedBuyers}=  require("../controllers/transferController");

const router = express.Router();

router.post("/add-transfer",addTransfer);
router.post("/get-transfers",getTransfers);
router.post("/add-to-interested-buyers",addToInterestedBuyers);
router.post("/get-interested-buyers",getInterestedBuyers);
router.post("/update-buyers-status",updateBuyersStatus);
router.post("/remove-buyer",removeBuyer)
module.exports=router;