const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/user.routes");
const connectionRoutes = require("./routes/connection.route");
const skillRoutes = require("./routes/skill.route");
const appointmentRoutes = require("./routes/appointment.routes");
const chatRoutes = require("./routes/chat.route");
const errorMiddleware = require("./middlewares/error.middleware");

const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request body
app.use(morgan("dev")); // Log HTTP requests

// Phục vụ static files
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads/avatars"))
); // Thêm dòng này

// Routes
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/chats", chatRoutes);

// Error handling middleware (luôn đặt cuối cùng)
app.use(errorMiddleware);

module.exports = app;
