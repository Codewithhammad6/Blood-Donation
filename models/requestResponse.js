import mongoose from 'mongoose';

const requestResponseSchema = new mongoose.Schema({

  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodRequest",
    required: true
  },

  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: [
      "accepted",
      "withdrawn",
      "completed"
    ],
    default: "accepted"
  },

  acceptedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: Date

}, { timestamps: true });

requestResponseSchema.index(
  { bloodRequest: 1, donor: 1 },
  { unique: true }
);

requestResponseSchema.index({ donor: 1, status: 1 });

const RequestResponse = mongoose.model("RequestResponse", requestResponseSchema);
export default RequestResponse;