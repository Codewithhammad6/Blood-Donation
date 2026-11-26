import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

email: {
  type: String,
  required: [true, "Email is required"],
  validate: {
    validator: function (v) {
  return /^\S+@\S+\.\S+$/.test(v);
},
    message: (props) => `${props.value} is not a valid email!`,
  },
  unique: true,
},
  password: {
    type: String,
    select: false,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    maxlength: [32, "Password cannot exceed 32 characters"],
  },

phone: {
  type: String,
  match: [/^03\d{9}$/, "Please enter a valid 11-digit Pakistani phone number"]
},
cnic: {
  type: String,
  required: true,
  unique: true,
  match: [/^\d{5}-\d{7}-\d{1}$/, "Please enter a valid 13-digit CNIC (XXXXX-XXXXXXX-X)"]
},
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },

  city: {
    type: String,
  },

  location: {
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number],
  }
},

  isDonor: {
    type: Boolean,
    default: false
  },

  isAvailable: {
    type: Boolean,
    default: false
  },

  verified: {
    type: Boolean,
    default: false
  },
  verificationToken:String

}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

userSchema.index({
  bloodGroup: 1,
  isDonor: 1,
  isAvailable: 1
});

// Hash Password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


// Compare Password
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
      {id: this._id}, 
      process.env.JWT_SECRET_KEY || 'fallback_secret', // Add fallback
      {
        expiresIn: process.env.JWT_EXPIRE || '7d' // Default 7 days
      }
    );
    return token;
};

// Generate a 6-digit random number
userSchema.methods.generateCode = function() {
  const token = Math.floor(100000 + Math.random() * 900000).toString(); 
  this.verificationToken = token;
  return token;
}


const User = mongoose.model('User', userSchema);
export default User;