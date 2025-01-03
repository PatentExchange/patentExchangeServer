const express = require("express");
const { addPatent, getPatentsById, getPatents } = require("../controllers/patentController");

const router = express.Router();

// Define routes
router.post("/add-patent", addPatent);
//router.post("/get-all-patents");
router.get("/get-patents/:submitter", getPatents);


module.exports = router;