import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({

  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: [
      "new_blood_request",
      "donor_accepted",
      "request_updated",
      "request_cancelled",
      "donation_completed"
    ],
    required: true
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodRequest"
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1
});

const NotificationModel = mongoose.model("Notification", notificationSchema);
export default NotificationModel;