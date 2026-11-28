import express from "express";
import { registerUser, verifyEmail, login, getUserProfile, logout, forgotPassword, verifyForgot, newPassword, updateProfile, toggleDonorStatus, toggleAvailability } from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verifyEmail", verifyEmail);
router.post("/login", login);

router.get("/me", authenticateUser, getUserProfile);
router.post("/logout", authenticateUser, logout);
router.post("/forgot", forgotPassword);
router.post("/verifyForgot", verifyForgot);
router.post("/newPassword", newPassword);
router.put("/update-profile", authenticateUser, updateProfile);
router.put("/toggle-donor", authenticateUser, toggleDonorStatus);
router.put("/toggle-availability", authenticateUser, toggleAvailability);

export default router;