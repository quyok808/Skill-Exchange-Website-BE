const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Người đặt lịch
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Người nhận lịch
  startTime: { type: Date, required: true }, // Thời gian bắt đầu
  endTime: { type: Date, required: true }, // Thời gian kết thúc
  description: { type: String }, // Mô tả (tùy chọn)
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "canceled", "completed"],
    default: "pending", // Trạng thái (pending, accepted, rejected, canceled, completed)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
