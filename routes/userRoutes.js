const express = require("express");
const { signup, login, getAllUsers, getUserById } = require("../controllers/userController");

const router = express.Router();

// Define routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/get-all-users", getAllUsers);
router.get("/get-user/:id", getUserById);

module.exports = router;