import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

 bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    required: true
  },

  unitsRequired: {
    type: Number,
    required: true,
    min: 1
  },

  urgency: {
    type: String,
    enum: ["Low", "Medium", "High", "Emergency"],
    required: true
  },

  hospital: {
    name: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    phone: String
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },

    coordinates: {
      type: [Number],
      required: true
    }
  },

  status: {
    type: String,
    enum: [
      "open",
      "partially_fulfilled",
      "fulfilled",
      "completed",
      "cancelled",
      "expired"
    ],
    default: "open"
  },

  expiresAt: Date

}, { timestamps: true });

bloodRequestSchema.index({ location: "2dsphere" });

bloodRequestSchema.index({ status: 1, createdAt: -1 });

bloodRequestSchema.index({ patient: 1, createdAt: -1 });

const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);
export default BloodRequest;