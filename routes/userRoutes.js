const express = require("express");
const { signup, login, getAllUsers, getUserById,verifyOTP, forgotPassword, resetPassword } = require("../controllers/userController");

const router = express.Router();

// Define routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/get-all-users", getAllUsers);
router.get("/get-user/:id", getUserById);
router.post("/signup/otp-verification",verifyOTP);
router.post("/login/forgot-password",forgotPassword)
router.post("/login/reset-password/:_id/:token",resetPassword)

module.exports = router;