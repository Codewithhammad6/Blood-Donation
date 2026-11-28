// import { catchAsyncError } from "../middlewares/catchAsyncError.js";
// import User from "../models/userModel.js"
// import ErrorHandler from "../middlewares/error.js";
// import { sendToken } from "../utils/sendToken.js";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();
// // REGISTER
// export const registerUser = catchAsyncError(async (req, res, next) => {
//   const { name, email, password, cnic, phone, bloodGroup, city, location, gender, age, weight } = req.body;

//   if (!name || !email || !password || !cnic || !phone || !bloodGroup || !city || !location || !gender || !age || !weight ) {
//     return next(new ErrorHandler("All fields required", 400));
//   }
//   console.log(name, email, password, cnic);
//   const emailRegex = /^\S+@\S+\.\S+$/;
//   if (!emailRegex.test(email)) {
//     return next(new ErrorHandler("Invalid email format", 400));
//   }

//   // Check if email or cnic exists at all
//   let existingUser = await User.findOne({ $or: [{ email }, { cnic }] });
//   // If already verified, block
//   if (existingUser && existingUser.verified) {
//     return next(new ErrorHandler("Email or CNIC is already used.", 400));
//   }

//   // If exists but not verified → just update token + password and resend
//   if (existingUser && !existingUser.verified) {
//     existingUser.name = name;
//     existingUser.password = password;
//     existingUser.cnic = cnic;
//     existingUser.phone = phone;
//     existingUser.bloodGroup = bloodGroup;
//     existingUser.city = city;
//     existingUser.location = location;
//     existingUser.gender = gender;
//     existingUser.age = age;
//     existingUser.weight = weight;


//     const verificationToken = existingUser.generateCode();
//     await existingUser.save();

//     await sendVerificationEmail(existingUser.email, verificationToken);

//     return res.status(200).json({
//       success: true,
//       message: "Verification code resent to your email.",
//     });
//   }

//   // userController.js -> registerUser ke andar
// const formattedLocation =
//   typeof location === "string"
//     ? {
//         type: "Point",
//         coordinates: [0, 0], // [longitude, latitude] default ya frontend se bhejein
//         address: location,   // agar schema mein address field ho
//       }
//     : location;

//   // Otherwise, create new user
//   const newUser = new User({ name, email, password, cnic, phone, bloodGroup, city, location: formattedLocation, gender, age, weight });
//   const verificationToken = newUser.generateCode();
//   await newUser.save();
//   await sendVerificationEmail(newUser.email, verificationToken);

//   res.status(201).json({
//     success: true,
//     message:
//       "User registered successfully. Please check your email for verification.",
//   });
// })

// // SEND VERIFICATION EMAIL
// const sendVerificationEmail = async (email, verificationToken) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT),
//     secure: process.env.SMTP_PORT == 465,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.MAIL_FROM || `Blood-Donation <blood@gmail.com>`,
//     to: email,
//     bcc: process.env.SMTP_USER,
//     subject: "✨ Verify your email address",
//     html: `
//      <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:30px;">
//   <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:25px;">
    
//     <!-- Header -->
//     <div style="text-align:center; margin-bottom:25px;">
//       <h1 style="color:#4199c7; margin:0; font-size:32px; font-weight:700;">Blood-Donation</h1>
//       <p style="color:#555; font-size:16px; margin-top:6px; font-weight:500;">Secure Email Verification</p>
//     </div>

//     <!-- Greeting -->
//     <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello,</p>
//     <p style="font-size:15px; color:#555; line-height:1.7; margin-top:0;">
//       We received a request to verify your email address. Please use the following
//       <strong style="color:#4199c7;">Valid within Ten Minutes</strong>
//       <strong style="color:#4199c7;">verification code</strong>:
//     </p>

//     <!-- Verification Code -->
//     <div style="text-align:center; margin:35px 0;">
//       <span style="display:inline-block; background:#4199c7; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:3px; padding:15px 35px; border-radius:8px;">
//         ${verificationToken}
//       </span>
//     </div>

//     <!-- Note -->
//     <p style="font-size:14px; color:#777; line-height:1.6; margin-top:0;">
//       If you didn’t request this, you can safely ignore this email.
//     </p>

//     <!-- Footer -->
//     <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">
//     <p style="font-size:13px; color:#999; text-align:center; margin:0;">
//       &copy; ${new Date().getFullYear()} Blood-Donation. All rights reserved.
//     </p>
//   </div>
// </div>

//     `,
//     text: `Welcome to Blood-Donation! Please verify your email: ${verificationToken}`,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export const verifyEmail = catchAsyncError(async (req, res, next) => {
//   const { code } = req.body;

//   // Find user with given token
//   const user = await User.findOne({ verificationToken: code });

//   if (!user) {
//     return next(new ErrorHandler("Invalid verification token", 400));
//   }
//   if (user.verificationToken !== code) {
//     return next(new ErrorHandler("Invalid verification token", 400));
//   }
//   user.verified = true;
//   user.verificationToken = undefined;
//   await user.save({ validateBeforeSave: false });

//   sendToken(user, 200, "successfully.", res);
// });

// // LOGIN
// export const login = catchAsyncError(async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return next(new ErrorHandler("All fields required", 400));
//   }

//   // Email format check
//   const emailRegex = /^\S+@\S+\.\S+$/;
//   if (!emailRegex.test(email)) {
//     return next(new ErrorHandler("Invalid email format", 400));
//   }

//   // Only login verified users
//   let user;
//   try {
//     user = await User.findOne({ email, verified: true }).select("+password");
//   } catch (dbError) {
//     console.error("Database error during login:", dbError);
//     return next(
//       new ErrorHandler("Database connection error. Please try again.", 503),
//     );
//   }

//   if (!user) {
//     return next(
//       new ErrorHandler("Invalid credentials or email not verified", 400),
//     );
//   }

//   // check password
//   const isMatch = await user.comparePassword(password);
//   if (!isMatch) {
//     return next(new ErrorHandler("Invalid password ", 400));
//   }

//   sendToken(user, 200, "User logged in successfully.", res);
// });

// export const getUserProfile = catchAsyncError(async (req, res, next) => {
//   const user = req.user;
//   res.status(200).json({
//     success: true,
//     user,
//   });
// });

// export const logout = catchAsyncError(async (req, res, next) => {
//   // Detect environment properly - check multiple sources for production
//   const isProduction =
//     process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

//   console.log(
//     "Logout - Environment:",
//     process.env.NODE_ENV,
//     "IsProduction:",
//     isProduction,
//   );

//   res.cookie("blood-donation", null, {
//     expires: new Date(Date.now()),
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     path: "/",
//   });

//   res.status(200).json({
//     success: true,
//     message: "Logged out successfully.",
//   });
// });

// export const forgotPassword = catchAsyncError(async (req, res, next) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email, verified: true });
//   if (!user) {
//     return next(new ErrorHandler("User not found", 400));
//   }

//   const verificationToken = await user.generateCode();
//   user.verificationToken = verificationToken;

//   // send verification email
//   await sendVerificationEmailForget(user.email, verificationToken);

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Verify your email",
//   });
// });

// // SEND VERIFICATION EMAIL
// const sendVerificationEmailForget = async (email, verificationToken) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT),
//     secure: true,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.MAIL_FROM || `Blood-Donation <blood@gmail.com>`,
//     to: email,
//     cc: process.env.SMTP_USER,

//     subject: "✨ Verify your email address",
//     html: `
//      <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:30px;">
//   <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:25px;">
    
//     <!-- Header -->
//     <div style="text-align:center; margin-bottom:25px;">
//       <h1 style="color:#4199c7; margin:0; font-size:32px; font-weight:700;">Blood-Donation</h1>
//       <p style="color:#555; font-size:16px; margin-top:6px; font-weight:500;">Secure Email Verification</p>
//     </div>

//     <!-- Greeting -->
//     <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello,</p>
//     <p style="font-size:15px; color:#555; line-height:1.7; margin-top:0;">
//       We received a request to verify your email address. Please use the following
//       <strong style="color:#4199c7;">verification code</strong>:
//     </p>

//     <!-- Verification Code -->
//     <div style="text-align:center; margin:35px 0;">
//       <span style="display:inline-block; background:#4199c7; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:3px; padding:15px 35px; border-radius:8px;">
//         ${verificationToken}
//       </span>
//     </div>

//     <!-- Note -->
//     <p style="font-size:14px; color:#777; line-height:1.6; margin-top:0;">
//       If you didn’t request this, you can safely ignore this email.
//     </p>

//     <!-- Footer -->
//     <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">
//     <p style="font-size:13px; color:#999; text-align:center; margin:0;">
//       &copy; ${new Date().getFullYear()} Blood-Donation. All rights reserved.
//     </p>
//   </div>
// </div>

//     `,
//     text: `Welcome to Blood-Donation! Please verify your email: ${verificationToken}`,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export const verifyForgot = catchAsyncError(async (req, res, next) => {
//   const { code } = req.body;

//   // Find user with given token
//   const user = await User.findOne({ verificationToken: code });

//   if (!user) {
//     return next(new ErrorHandler("Invalid verification token", 400));
//   }
//   if (user.verificationToken !== code) {
//     return next(new ErrorHandler("Invalid verification token", 400));
//   }

//   res.status(200).json({ message: "Email verified successfully" });
// });

// export const newPassword = catchAsyncError(async (req, res, next) => {
//   const { password, code } = req.body;
//   const user = await User.findOne({ verificationToken: code });
//   if (!user) {
//     return next(new ErrorHandler("Invalid token", 400));
//   }
//   user.password = password;
//   user.verificationToken = undefined;
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Password changed successfully.",
//   });
// });


// export const updateProfile = catchAsyncError(async (req, res, next) => {
//   const {name, bloodGroup, city, location } = req.body;

//   // Check required fields
//   if (
//     !name ||
//     !bloodGroup ||
//     !city ||
//     !location
//   ) {
//     return next(new ErrorHandler("Please fill all the fields", 400));
//   }

//   // Find logged-in user
//   const user = await User.findById(req.user._id);

//   if (!user) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   // Data to update
//   const data = {
//     name,
//     bloodGroup,
//     city,
//     location
//   };

//   // Update user profile
//   Object.assign(user, data);

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile updated successfully",
//   });
// });


// export const toggleDonorStatus = catchAsyncError(
//   async (req, res, next) => {

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     user.isDonor = !user.isDonor;

//     // Donor OFF ho to availability bhi OFF
//     if (!user.isDonor) {
//       user.isAvailable = false;
//     }

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Donor status updated",
//       isDonor: user.isDonor,
//       isAvailable: user.isAvailable
//     });
//   }
// );


// export const toggleAvailability = catchAsyncError(
//   async (req, res, next) => {

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     if (!user.isDonor) {
//       return next(
//         new ErrorHandler("Enable donor status first", 400)
//       );
//     }

//     user.isAvailable = !user.isAvailable;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Availability updated",
//       isAvailable: user.isAvailable
//     });
//   }
// );


import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import User from "../models/userModel.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/sendToken.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Helper to ensure GeoJSON Point format for Mongoose 2dsphere index
const formatGeoLocation = (location) => {
  if (typeof location === "string") {
    return {
      type: "Point",
      coordinates: [0, 0],
      address: location.trim(),
    };
  }
  if (location && typeof location === "object") {
    const coords =
      Array.isArray(location.coordinates) && location.coordinates.length === 2
        ? [Number(location.coordinates[0]) || 0, Number(location.coordinates[1]) || 0]
        : [0, 0];

    return {
      type: "Point",
      coordinates: coords,
      address: location.address ? String(location.address).trim() : "",
    };
  }
  return {
    type: "Point",
    coordinates: [0, 0],
    address: "",
  };
};

// REGISTER
export const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, cnic, phone, bloodGroup, city, location, gender, age, weight } = req.body;

  if (!name || !email || !password || !cnic || !phone || !bloodGroup || !city || !location || !gender || !age || !weight) {
    return next(new ErrorHandler("All fields required", 400));
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Invalid email format", 400));
  }

  const formattedLocation = formatGeoLocation(location);

  // Check if email or cnic exists at all
  let existingUser = await User.findOne({ $or: [{ email }, { cnic }] });

  // If already verified, block
  if (existingUser && existingUser.verified) {
    return next(new ErrorHandler("Email or CNIC is already used.", 400));
  }

  // If exists but not verified → update details + resend verification code
  if (existingUser && !existingUser.verified) {
    existingUser.name = name;
    existingUser.password = password;
    existingUser.cnic = cnic;
    existingUser.phone = phone;
    existingUser.bloodGroup = bloodGroup;
    existingUser.city = city;
    existingUser.location = formattedLocation;
    existingUser.gender = gender;
    existingUser.age = Number(age);
    existingUser.weight = Number(weight);

    const verificationToken = existingUser.generateCode();
    await existingUser.save();

    await sendVerificationEmail(existingUser.email, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Verification code resent to your email.",
    });
  }

  // Otherwise, create new user
  const newUser = new User({
    name,
    email,
    password,
    cnic,
    phone,
    bloodGroup,
    city,
    location: formattedLocation,
    gender,
    age: Number(age),
    weight: Number(weight),
  });

  const verificationToken = newUser.generateCode();
  await newUser.save();
  await sendVerificationEmail(newUser.email, verificationToken);

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please check your email for verification.",
  });
});

// SEND VERIFICATION EMAIL
const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || `Blood-Donation <blood@gmail.com>`,
    to: email,
    bcc: process.env.SMTP_USER,
    subject: "✨ Verify your email address",
    html: `
     <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:25px;">
        <div style="text-align:center; margin-bottom:25px;">
          <h1 style="color:#4199c7; margin:0; font-size:32px; font-weight:700;">Blood-Donation</h1>
          <p style="color:#555; font-size:16px; margin-top:6px; font-weight:500;">Secure Email Verification</p>
        </div>
        <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello,</p>
        <p style="font-size:15px; color:#555; line-height:1.7; margin-top:0;">
          We received a request to verify your email address. Please use the following
          <strong style="color:#4199c7;">Valid within Ten Minutes</strong>
          <strong style="color:#4199c7;">verification code</strong>:
        </p>
        <div style="text-align:center; margin:35px 0;">
          <span style="display:inline-block; background:#4199c7; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:3px; padding:15px 35px; border-radius:8px;">
            ${verificationToken}
          </span>
        </div>
        <p style="font-size:14px; color:#777; line-height:1.6; margin-top:0;">
          If you didn’t request this, you can safely ignore this email.
        </p>
        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">
        <p style="font-size:13px; color:#999; text-align:center; margin:0;">
          &copy; ${new Date().getFullYear()} Blood-Donation. All rights reserved.
        </p>
      </div>
    </div>
    `,
    text: `Welcome to Blood-Donation! Please verify your email: ${verificationToken}`,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyEmail = catchAsyncError(async (req, res, next) => {
  const { code } = req.body;

  const user = await User.findOne({ verificationToken: code });

  if (!user || user.verificationToken !== code) {
    return next(new ErrorHandler("Invalid verification token", 400));
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, "successfully.", res);
});

// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("All fields required", 400));
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Invalid email format", 400));
  }

  let user;
  try {
    user = await User.findOne({ email, verified: true }).select("+password");
  } catch (dbError) {
    console.error("Database error during login:", dbError);
    return next(new ErrorHandler("Database connection error. Please try again.", 503));
  }

  if (!user) {
    return next(new ErrorHandler("Invalid credentials or email not verified", 400));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid password ", 400));
  }

  sendToken(user, 200, "User logged in successfully.", res);
});

export const getUserProfile = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});

export const logout = catchAsyncError(async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  res.cookie("blooddonation", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email, verified: true });
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }

  const verificationToken = await user.generateCode();
  user.verificationToken = verificationToken;

  await sendVerificationEmailForget(user.email, verificationToken);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Verify your email",
  });
});

const sendVerificationEmailForget = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM || `Blood-Donation <blood@gmail.com>`,
    to: email,
    cc: process.env.SMTP_USER,
    subject: "✨ Verify your email address",
    html: `
     <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:25px;">
        <div style="text-align:center; margin-bottom:25px;">
          <h1 style="color:#4199c7; margin:0; font-size:32px; font-weight:700;">Blood-Donation</h1>
          <p style="color:#555; font-size:16px; margin-top:6px; font-weight:500;">Secure Email Verification</p>
        </div>
        <p style="font-size:16px; color:#333; margin-bottom:10px;">Hello,</p>
        <p style="font-size:15px; color:#555; line-height:1.7; margin-top:0;">
          We received a request to verify your email address. Please use the following
          <strong style="color:#4199c7;">verification code</strong>:
        </p>
        <div style="text-align:center; margin:35px 0;">
          <span style="display:inline-block; background:#4199c7; color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:3px; padding:15px 35px; border-radius:8px;">
            ${verificationToken}
          </span>
        </div>
        <p style="font-size:14px; color:#777; line-height:1.6; margin-top:0;">
          If you didn’t request this, you can safely ignore this email.
        </p>
        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">
        <p style="font-size:13px; color:#999; text-align:center; margin:0;">
          &copy; ${new Date().getFullYear()} Blood-Donation. All rights reserved.
        </p>
      </div>
    </div>
    `,
    text: `Welcome to Blood-Donation! Please verify your email: ${verificationToken}`,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyForgot = catchAsyncError(async (req, res, next) => {
  const { code } = req.body;

  const user = await User.findOne({ verificationToken: code });

  if (!user || user.verificationToken !== code) {
    return next(new ErrorHandler("Invalid verification token", 400));
  }

  res.status(200).json({ message: "Email verified successfully" });
});

export const newPassword = catchAsyncError(async (req, res, next) => {
  const { password, code } = req.body;
  const user = await User.findOne({ verificationToken: code });
  if (!user) {
    return next(new ErrorHandler("Invalid token", 400));
  }
  user.password = password;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, phone, bloodGroup, gender, age, weight, city, location } = req.body;

  if (!name || !bloodGroup || !city || !location) {
    return next(new ErrorHandler("Please fill all required fields", 400));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.name = name;
  if (phone) user.phone = phone;
  user.bloodGroup = bloodGroup;
  if (gender) user.gender = gender;
  if (age !== undefined) user.age = Number(age);
  if (weight !== undefined) user.weight = Number(weight);
  user.city = city;
  user.location = formatGeoLocation(location);

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

export const toggleDonorStatus = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.isDonor = !user.isDonor;

  if (!user.isDonor) {
    user.isAvailable = false;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Donor status updated",
    isDonor: user.isDonor,
    isAvailable: user.isAvailable,
  });
});

export const toggleAvailability = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!user.isDonor) {
    return next(new ErrorHandler("Enable donor status first", 400));
  }

  user.isAvailable = !user.isAvailable;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Availability updated",
    isAvailable: user.isAvailable,
  });
});