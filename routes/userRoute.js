import express from "express";
import { registerUser, verifyEmail, login, getUserProfile, logout, forgotPassword, verifyForgot, newPassword, updateProfile, toggleDonorStatus, toggleAvailability } from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.get("/profile", authenticateUser, getUserProfile);
router.post("/logout", authenticateUser, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot", verifyForgot);
router.post("/new-password", newPassword);
router.put("/update-profile", authenticateUser, updateProfile);
router.put("/toggle-donor-status", authenticateUser, toggleDonorStatus);
router.put("/toggle-availability", authenticateUser, toggleAvailability);

export default router;