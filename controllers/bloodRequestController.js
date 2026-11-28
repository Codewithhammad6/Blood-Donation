import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import BloodRequest from "../models/bloodRequestModel.js";
import RequestResponse from "../models/requestResponseModel.js";
import NotificationModel from "../models/notificationModel.js";
import User from "../models/userModel.js";

// Haversine Distance in Kilometers
const calculateDistanceKm = (coords1, coords2) => {
  if (
    !Array.isArray(coords1) ||
    !Array.isArray(coords2) ||
    coords1.length < 2 ||
    coords2.length < 2
  ) {
    return null;
  }
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  if ((lon1 === 0 && lat1 === 0) || (lon2 === 0 && lat2 === 0)) return null;

  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

// 1. CREATE BLOOD REQUEST & NOTIFY MATCHING DONORS
export const createBloodRequest = catchAsyncError(async (req, res, next) => {
  const { bloodGroup, unitsRequired, urgency, hospital, location, expiresInHours } = req.body;

  if (
    !bloodGroup ||
    !unitsRequired ||
    !urgency ||
    !hospital?.name ||
    !hospital?.address ||
    !hospital?.city
  ) {
    return next(new ErrorHandler("All blood request and hospital fields are required", 400));
  }

const coords =
    Array.isArray(location?.coordinates) && location.coordinates.length === 2
      ? [Number(location.coordinates[0]) || 0, Number(location.coordinates[1]) || 0]
      : [0, 0];
  const expiresAt = new Date(
    Date.now() + (Number(expiresInHours) || 24) * 60 * 60 * 1000
  );

  const bloodRequest = await BloodRequest.create({
    patient: req.user._id,
    bloodGroup,
    unitsRequired: Number(unitsRequired),
    urgency,
    hospital: {
      name: hospital.name.trim(),
      address: hospital.address.trim(),
      city: hospital.city.trim(),
      phone: hospital.phone?.trim() || req.user.phone,
    },
    location: {
      type: "Point",
      coordinates: coords,
    },
    expiresAt,
  });

  // Notify donors with SAME bloodGroup
  const matchingDonors = await User.find({
    _id: { $ne: req.user._id },
    verified: true,
    isDonor: true,
    isAvailable: true,
    bloodGroup,
  }).select("_id name location city");

  if (matchingDonors.length > 0) {
    const notifications = matchingDonors.map((donor) => {
      const dist = calculateDistanceKm(donor.location?.coordinates, coords);
      const distText = dist !== null ? ` (~${dist} km away)` : ` in ${hospital.city}`;

      return {
        recipient: donor._id,
        type: "new_blood_request",
        title: `🚨 ${urgency} ${bloodGroup} Blood Needed`,
        message: `${unitsRequired} unit(s) needed at ${hospital.name}, ${hospital.city}${distText}.`,
        bloodRequest: bloodRequest._id,
      };
    });

    await NotificationModel.insertMany(notifications);
  }

  res.status(201).json({
    success: true,
    message: `Request submitted! ${matchingDonors.length} matching donor(s) notified.`,
    bloodRequest,
  });
});

// 2. GET MATCHING REQUESTS FOR DONOR (Same Blood Group + Distance)
export const getMatchingRequestsForDonor = catchAsyncError(async (req, res, next) => {
  const donor = req.user;

  const requests = await BloodRequest.find({
    patient: { $ne: donor._id },
    bloodGroup: donor.bloodGroup,
    status: { $in: ["open", "partially_fulfilled"] },
  })
    .populate("patient", "name phone age gender city")
    .sort({ createdAt: -1 });

  const myResponses = await RequestResponse.find({
    donor: donor._id,
    bloodRequest: { $in: requests.map((r) => r._id) },
  });

  const responseMap = new Map(
    myResponses.map((r) => [r.bloodRequest.toString(), r.status])
  );

  const enrichedRequests = requests.map((reqDoc) => ({
    ...reqDoc.toObject(),
    distanceKm: calculateDistanceKm(
      donor.location?.coordinates,
      reqDoc.location?.coordinates
    ),
    myResponseStatus: responseMap.get(reqDoc._id.toString()) || null,
  }));

  enrichedRequests.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    return 0;
  });

  res.status(200).json({
    success: true,
    requests: enrichedRequests,
  });
});

// 3. DONOR ACCEPTS REQUEST -> NOTIFIES PATIENT & REVEALS DONOR CONTACT
export const acceptBloodRequest = catchAsyncError(async (req, res, next) => {
  const { requestId } = req.params;
  const donor = req.user;

  if (!donor.isDonor) {
    return next(new ErrorHandler("Please enable Donor Status first.", 400));
  }

  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) {
    return next(new ErrorHandler("Blood request not found.", 404));
  }

  if (bloodRequest.patient.toString() === donor._id.toString()) {
    return next(new ErrorHandler("You cannot accept your own request.", 400));
  }

  if (!["open", "partially_fulfilled"].includes(bloodRequest.status)) {
    return next(new ErrorHandler("This request is no longer active.", 400));
  }

  if (bloodRequest.bloodGroup !== donor.bloodGroup) {
    return next(new ErrorHandler("Blood group does not match.", 400));
  }

  const existingResponse = await RequestResponse.findOne({
    bloodRequest: requestId,
    donor: donor._id,
  });

  if (existingResponse && existingResponse.status === "accepted") {
    return next(new ErrorHandler("You already accepted this request.", 400));
  }

  if (existingResponse) {
    existingResponse.status = "accepted";
    existingResponse.acceptedAt = new Date();
    await existingResponse.save();
  } else {
    await RequestResponse.create({
      bloodRequest: requestId,
      donor: donor._id,
      status: "accepted",
    });
  }

  const acceptedCount = await RequestResponse.countDocuments({
    bloodRequest: requestId,
    status: { $in: ["accepted", "completed"] },
  });

  bloodRequest.status =
    acceptedCount >= bloodRequest.unitsRequired ? "fulfilled" : "partially_fulfilled";
  await bloodRequest.save();

  const distanceKm = calculateDistanceKm(
    donor.location?.coordinates,
    bloodRequest.location?.coordinates
  );

  await NotificationModel.create({
    recipient: bloodRequest.patient,
    type: "donor_accepted",
    title: `❤️ Donor Accepted (${donor.bloodGroup})`,
    message: `${donor.name} (${donor.phone}) accepted your request at ${bloodRequest.hospital.name}${
      distanceKm !== null ? ` • ${distanceKm} km away` : ""
    }.`,
    bloodRequest: bloodRequest._id,
  });

  res.status(200).json({
    success: true,
    message: "Accepted! Patient can now see your details and contact you.",
  });
});

// 4. GET PATIENT'S OWN REQUESTS + ACCEPTED DONOR DETAILS
export const getMyBloodRequests = catchAsyncError(async (req, res, next) => {
  const requests = await BloodRequest.find({ patient: req.user._id }).sort({
    createdAt: -1,
  });

  const responses = await RequestResponse.find({
    bloodRequest: { $in: requests.map((r) => r._id) },
    status: { $in: ["accepted", "completed"] },
  }).populate("donor", "name phone bloodGroup age weight gender city location");

  const requestsWithDonors = requests.map((reqDoc) => {
    const matchedResponses = responses
      .filter((resp) => resp.bloodRequest.toString() === reqDoc._id.toString())
      .map((resp) => ({
        responseId: resp._id,
        status: resp.status,
        acceptedAt: resp.acceptedAt,
        completedAt: resp.completedAt,
        distanceKm: calculateDistanceKm(
          resp.donor?.location?.coordinates,
          reqDoc.location?.coordinates
        ),
        donor: resp.donor,
      }));

    return {
      ...reqDoc.toObject(),
      acceptedDonors: matchedResponses,
    };
  });

  res.status(200).json({
    success: true,
    requests: requestsWithDonors,
  });
});

// 5. CANCEL REQUEST & MARK DONATION COMPLETED
export const cancelBloodRequest = catchAsyncError(async (req, res, next) => {
  const bloodRequest = await BloodRequest.findOne({
    _id: req.params.requestId,
    patient: req.user._id,
  });

  if (!bloodRequest) return next(new ErrorHandler("Request not found.", 404));

  bloodRequest.status = "cancelled";
  await bloodRequest.save();

  const acceptedDonors = await RequestResponse.find({
    bloodRequest: bloodRequest._id,
    status: "accepted",
  });

  if (acceptedDonors.length > 0) {
    await NotificationModel.insertMany(
      acceptedDonors.map((d) => ({
        recipient: d.donor,
        type: "request_cancelled",
        title: "Blood Request Cancelled",
        message: `The ${bloodRequest.bloodGroup} request at ${bloodRequest.hospital.name} was cancelled.`,
        bloodRequest: bloodRequest._id,
      }))
    );
  }

  res.status(200).json({ success: true, message: "Request cancelled." });
});

export const markDonationCompleted = catchAsyncError(async (req, res, next) => {
  const response = await RequestResponse.findById(req.params.responseId).populate("bloodRequest");
  if (!response || !response.bloodRequest) {
    return next(new ErrorHandler("Record not found.", 404));
  }
  if (response.bloodRequest.patient.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized.", 403));
  }

  response.status = "completed";
  response.completedAt = new Date();
  await response.save();

  const completedCount = await RequestResponse.countDocuments({
    bloodRequest: response.bloodRequest._id,
    status: "completed",
  });

  if (completedCount >= response.bloodRequest.unitsRequired) {
    response.bloodRequest.status = "completed";
    await response.bloodRequest.save();
  }

  await NotificationModel.create({
    recipient: response.donor,
    type: "donation_completed",
    title: "🎉 Donation Completed!",
    message: `Patient confirmed your donation at ${response.bloodRequest.hospital.name}. Thank you!`,
    bloodRequest: response.bloodRequest._id,
  });

  res.status(200).json({ success: true, message: "Marked as completed!" });
});

// 6. NOTIFICATIONS
export const getMyNotifications = catchAsyncError(async (req, res, next) => {
  const notifications = await NotificationModel.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);
  const unreadCount = await NotificationModel.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  res.status(200).json({ success: true, notifications, unreadCount });
});

export const markNotificationsRead = catchAsyncError(async (req, res, next) => {
  await NotificationModel.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  res.status(200).json({ success: true });
});


// GET DONOR'S COMPLETE DONATION LIST (Kab, Kisay, Aur Kahan Donate Kiya)
export const getMyDonationHistory = catchAsyncError(async (req, res, next) => {
  const donations = await RequestResponse.find({ donor: req.user._id })
    .populate({
      path: "bloodRequest",
      select: "bloodGroup unitsRequired urgency hospital status createdAt",
      populate: {
        path: "patient",
        select: "name phone city gender age",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    donations,
  });
});