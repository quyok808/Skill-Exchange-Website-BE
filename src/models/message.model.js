const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true}, // ID của cuộc trò chuyện (tạo từ user1 + user2)
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người gửi
  message: { type: String, required: true }, // Nội dung tin nhắn
  timestamp: { type: Date, default: Date.now }, // Thời gian gửi
  isRead: { type: Boolean, default: false },
});

module.exports = mongoose.model("Messages", MessageSchema);
