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
const aiRoutes = require("./routes/aiRoutes");
const chatRoutes = require("./routes/chatRoutes");
const donationRoutes = require("./routes/donationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const routeRoutes = require("./routes/routeRoutes");
const { getAdminAnalytics } = require("./controllers/adminAnalyticsController");
const verifyFirebaseToken = require("./middleware/verifyFirebaseToken");
const authorizeRoles = require("./middleware/authorizeRoles");

const app = express();

app.use(helmet());
// Accept the configured frontend URL plus any localhost dev port (Vite may
// fall back to 5174/5175 when 5173 is taken), so a stray port never surfaces
// as a browser "Network Error" on login/registration.
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"].filter(Boolean)
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
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
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/route", routeRoutes);
app.get("/api/admin/analytics", verifyFirebaseToken, authorizeRoles("admin"), getAdminAnalytics);


// Unknown route → JSON, not Express's default HTML
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Must be LAST — Express only reaches it after everything above
app.use(errorHandler);

module.exports = app;
