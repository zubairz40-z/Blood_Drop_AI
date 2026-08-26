require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const hospitals = await User.find({ role: 'hospital' }).sort({ name: 1 }).lean();
  console.log('HOSPITAL_COUNT', hospitals.length);
  console.log(JSON.stringify(hospitals.map((h) => ({
    name: h.name,
    email: h.email,
    firebaseUid: h.firebaseUid || null,
    id: String(h._id)
  })), null, 2));

  const dupes = await User.aggregate([
    { $match: { firebaseUid: { $ne: null } } },
    { $group: { _id: '$firebaseUid', count: { $sum: 1 }, docs: { $push: { _id: '$_id', name: '$name', email: '$email', role: '$role' } } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log('DUPES', JSON.stringify(dupes, null, 2));
  await mongoose.disconnect();
})();
