const { default: mongoose } = require("mongoose");

const reportScheme = mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Processing",
        "Completed",
        "Canceled",
        "Banned",
        "Warning",
        "Warned"
      ],
      default: "Processing"
    },
    reason: { type: String, required: true },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportScheme);
