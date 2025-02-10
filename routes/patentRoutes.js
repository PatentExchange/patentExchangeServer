const express = require("express");
const {getFileUrls,updatePatent,updatePatentOwner, addPatent,appendPatentFiles, getPatentsById, getPatents, getAllPatent } = require("../controllers/patentController");

const router = express.Router();

router.post("/add-patent", addPatent);
router.get("/get-all-patents",getAllPatent);
router.get("/get-patents/:submitter", getPatents);
router.post("/add-patent-files",appendPatentFiles);
router.post("/get-file-urls",getFileUrls);
router.post("/update-patent-owner",updatePatentOwner);
router.put("/update-patent/:id",updatePatent);




module.exports = router;