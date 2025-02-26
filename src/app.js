const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/user.routes");
const skillRoutes = require("./routes/skill.route");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request body
app.use(morgan("dev")); // Log HTTP requests

// Routes
app.use("/api/users", userRoutes);
app.use("/api/skill", skillRoutes);

// Error handling middleware (luôn đặt cuối cùng)
app.use(errorMiddleware);

module.exports = app;
