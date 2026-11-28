import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import ErrorHandler from "./error.js";
import { catchAsyncError } from "./catchAsyncError.js";

export const authenticateUser = catchAsyncError(async (req, res, next) => {
  let token = req.cookies.blooddonation;

  // Header se token lena
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Token check
  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  try {
    // JWT verify
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // User find
    req.user = await User.findById(decodedData.id);

    if (!req.user) {
      return next(new ErrorHandler("User not found", 404));
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Session expired, please login again", 401));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid token, please login again", 401));
    }

    return next(new ErrorHandler("Authentication failed", 401));
  }
});
