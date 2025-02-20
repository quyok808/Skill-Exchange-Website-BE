const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d", // Tự động xóa sau 30 ngày
  },
});

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
