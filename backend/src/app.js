const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const donorRoutes = require("./routes/donorRoutes");
const requestRoutes = require("./routes/requestRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const donationRoutes = require("./routes/donationRoutes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ success: true, message: "BloodDrop AI API" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/donations", donationRoutes);


// Unknown route → JSON, not Express's default HTML
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Must be LAST — Express only reaches it after everything above
app.use(errorHandler);

module.exports = app;