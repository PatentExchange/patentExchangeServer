const express = require("express");
const {getFileUrls,declineSMERequest,approveSMERequest,deletePatent,getSMERequests,updatePatent,updatePatentOwner, addPatent,appendPatentFiles, getPatentsById, getPatents, getAllPatent } = require("../controllers/patentController");

const router = express.Router();

router.post("/add-patent", addPatent);
router.get("/get-all-patents",getAllPatent);
router.get("/get-patents/:owner", getPatents);
router.post("/add-patent-files",appendPatentFiles);
router.post("/get-file-urls",getFileUrls);
router.post("/update-patent-owner",updatePatentOwner);
router.put("/update-patent/:id",updatePatent);
router.post("/update-patent-owner",updatePatentOwner);
router.post("/delete-patent/:id", deletePatent);
router.get("/get-requests", getSMERequests);
router.post("/approve-patent", approveSMERequest);
router.post("/decline-patent", declineSMERequest);



module.exports = router;