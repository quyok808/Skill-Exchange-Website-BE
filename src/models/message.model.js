const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: {
      type: String,
      default: null
    },
    file: {
      type: String,
      default: null
    },
    image: {
      // Thêm trường imageUrl
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
