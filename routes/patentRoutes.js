const express = require("express");
const { addPatent, getPatentsById, getPatents, getAllPatent } = require("../controllers/patentController");

const router = express.Router();

router.post("/add-patent", addPatent);
router.get("/get-all-patents",getAllPatent);
router.get("/get-patents/:submitter", getPatents);



module.exports = router;