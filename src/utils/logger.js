// src/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info", // Cấp độ log mặc định
  format: winston.format.combine(
    winston.format.timestamp({
      format: "DD-MM-YYYY|HH:mm:ss", // Proper format for timestamps
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Ghi log ra console
    new winston.transports.File({ filename: "logs/app.log" }), // Ghi log ra file
  ],
});

module.exports = logger;
