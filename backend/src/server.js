require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;

async function start() {
  // Only listen once the database is actually reachable
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down`);
    server.close(async () => {
      await mongoose.disconnect();
      console.log("MongoDB disconnected. Bye.");
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();