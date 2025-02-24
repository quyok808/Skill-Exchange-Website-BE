const ChatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ], // Danh sách người tham gia (2 người)
  lastMessage: { type: String }, // Tin nhắn gần nhất
  lastMessageTime: { type: Date },
});

module.exports = mongoose.model("Chat", ChatSchema);
