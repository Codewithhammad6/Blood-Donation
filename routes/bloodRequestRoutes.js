import express from "express";
import { authenticateUser } from "../middlewares/auth.js";

import {
  createBloodRequest,
  getMatchingRequestsForDonor,
  acceptBloodRequest,
  getMyBloodRequests,
  cancelBloodRequest,
  markDonationCompleted,
  getMyNotifications,
  markNotificationsRead,
  getMyDonationHistory,
} from "../controllers/bloodRequestController.js";

const router = express.Router();

router.post("/request", authenticateUser, createBloodRequest);
router.get("/my-requests", authenticateUser, getMyBloodRequests);
router.get("/matching-requests", authenticateUser, getMatchingRequestsForDonor);
router.post("/accept/:requestId", authenticateUser, acceptBloodRequest);
router.put("/cancel/:requestId", authenticateUser, cancelBloodRequest);
router.put("/complete/:responseId", authenticateUser, markDonationCompleted);
router.get("/notifications", authenticateUser, getMyNotifications);
router.put("/notifications/read-all", authenticateUser, markNotificationsRead);
router.get("/my-donations", authenticateUser, getMyDonationHistory);
export default router;