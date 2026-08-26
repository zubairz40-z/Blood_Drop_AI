const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const { COMPONENT_CODES } = require("../utils/donationRules");
const { STATUS, assertTransition, isTerminal } = require("../utils/requestStatus");

/** POST /api/requests — patients file their own; hospitals file emergencies */
async function createRequest(req, res, next) {
  try {
    const isHospital = req.currentUser.role === "hospital";

    const {
      hospital,
      bloodGroup,
      component,
      unitsRequired,
      urgency,
      neededBy,
      location,
      patientNote,
      patientName,
      patientPhone,
    } = req.body;

    if (!COMPONENT_CODES.includes(component)) {
      return res.status(400).json({
        success: false,
        message: `Unknown component: ${component}`,
      });
    }

    if (new Date(neededBy) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "The needed-by date must be in the future.",
      });
    }

    let hospitalId;
    let patientId = null;
    let status;

    if (isHospital) {
      // A hospital files against itself — it IS the verifying party,
      // so the request skips verification and is attributed to the staff account.
      hospitalId = req.currentUser._id;
      status = STATUS.VERIFIED;

      if (!patientName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Provide the patient's name, or a description if unidentified.",
        });
      }

      if (patientPhone?.trim()) {
        const existing = await User.findOne({
          phone: patientPhone.trim(),
          role: "patient",
        });
        if (existing) patientId = existing._id;
      }
    } else {
      const hospitalUser = await User.findById(hospital);
      if (!hospitalUser || hospitalUser.role !== "hospital") {
        return res.status(400).json({ success: false, message: "Select a valid hospital." });
      }
      if (hospitalUser.accountStatus && hospitalUser.accountStatus !== "active") {
        return res.status(400).json({
          success: false,
          message: "That hospital is not currently approved.",
        });
      }

      hospitalId = hospitalUser._id;
      patientId = req.currentUser._id;
      status = STATUS.PENDING_VERIFICATION;
    }

    const hospitalDoc = isHospital ? req.currentUser : await User.findById(hospitalId);
    let requestLocation = location;
    if (hospitalDoc.location?.coordinates?.length === 2) {
      requestLocation = {
        type: "Point",
        coordinates: hospitalDoc.location.coordinates,
        address: hospitalDoc.address || location?.address || "",
      };
    }

    const request = await BloodRequest.create({
      patient: patientId,
      hospital: hospitalId,
      createdBy: req.currentUser._id,
      createdByHospital: isHospital,
      patientName: isHospital ? patientName : undefined,
      patientPhone: isHospital ? patientPhone : undefined,
      bloodGroup,
      component,
      unitsRequired,
      urgency,
      neededBy,
      location: requestLocation,
      patientNote,
      status,
      statusHistory: [
        {
          from: null,
          to: status,
          changedBy: req.currentUser._id,
          note: isHospital ? "Emergency request filed by hospital" : "Request created",
        },
      ],
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}
/** GET /api/requests/my — requests the caller owns or is responsible for */
async function getMyRequests(req, res, next) {
  try {
    const { role, _id } = req.currentUser;

    // Patients see what they created; hospitals see what they must verify
    const filter = role === "hospital" ? { hospital: _id } : { patient: _id };

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("hospital", "name email")
      .populate("patient", "name");

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
}

/** GET /api/requests/:id */
async function getRequestById(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate("hospital", "name email")
      .populate("patient", "name");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const { role, _id } = req.currentUser;
    const isOwner = request.patient?._id?.equals(_id) || false
    const isHospital = request.hospital._id.equals(_id);
    const isAdmin = role === "admin";

    if (!isOwner && !isHospital && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this request.",
      });
    }

    res.json({ success: true, request });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    next(err);
  }
}

/** PATCH /api/requests/:id — patient edits their own pending request */
const UPDATABLE_FIELDS = ["unitsRequired", "urgency", "neededBy", "patientNote", "location"];

async function updateRequest(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const isPatient = request.patient?.equals(req.currentUser._id);
    const isCreator = request.createdBy?.equals(req.currentUser._id);

    if (!isPatient && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own requests.",
      });
    }

    if (isTerminal(request.status)) {
      return res.status(409).json({
        success: false,
        message: `This request is ${request.status} and can no longer be edited.`,
      });
    }

    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No updatable fields provided." });
    }

    if (updates.neededBy && new Date(updates.neededBy) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "The needed-by date must be in the future.",
      });
    }

    Object.assign(request, updates);
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    next(err);
  }
}

/** POST /api/requests/:id/cancel — patient cancels; the record is kept */
async function cancelRequest(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const isPatient = request.patient?.equals(req.currentUser._id);
    const isCreator = request.createdBy?.equals(req.currentUser._id);

    if (!isPatient && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own requests.",
      });
    }

    assertTransition(request.status, STATUS.CANCELLED);

    request.applyStatus(STATUS.CANCELLED, req.currentUser._id, req.body.reason);
    request.cancelledAt = new Date();
    request.cancellationReason = req.body.reason || "Cancelled by patient";
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    next(err);
  }
}

/** POST /api/requests/:id/verify — hospital approves */
async function verifyRequest(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!request.hospital.equals(req.currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "This request was not addressed to your hospital.",
      });
    }

    assertTransition(request.status, STATUS.VERIFIED);

    request.applyStatus(STATUS.VERIFIED, req.currentUser._id, "Verified by hospital");
    request.verifiedBy = req.currentUser._id;
    request.verifiedAt = new Date();
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    next(err);
  }
}

/** POST /api/requests/:id/reject — hospital declines */
async function rejectRequest(req, res, next) {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!request.hospital.equals(req.currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "This request was not addressed to your hospital.",
      });
    }

    assertTransition(request.status, STATUS.REJECTED);

    request.applyStatus(STATUS.REJECTED, req.currentUser._id, req.body.reason);
    request.rejectionReason = req.body.reason || "No reason provided";
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    next(err);
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
  cancelRequest,
  verifyRequest,
  rejectRequest,
};