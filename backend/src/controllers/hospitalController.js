const User = require("../models/User");

/**
 * GET /api/hospitals
 * Approved hospitals, for the patient's request form.
 * Returns a minimal DTO — never the raw user document.
 */
async function listHospitals(req, res, next) {
  try {
    const hospitals = await User.find({
      role: "hospital",
      accountStatus: "active",
    })
      .select("_id name address location")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: hospitals.length,
        hospitals: hospitals.map((h) => ({
        id: h._id,
        name: h.name,
        address: h.address || null,
        coordinates: h.location?.coordinates?.length === 2 ? h.location.coordinates : null,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHospitals };