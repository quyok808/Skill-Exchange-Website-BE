const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // ID của cuộc trò chuyện (tạo từ user1 + user2)
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người gửi
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Người nhận
  message: { type: String, required: true }, // Nội dung tin nhắn
  timestamp: { type: Date, default: Date.now }, // Thời gian gửi
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  }, // Trạng thái tin nhắn
});

module.exports = mongoose.model("Messages", MessageSchema);
