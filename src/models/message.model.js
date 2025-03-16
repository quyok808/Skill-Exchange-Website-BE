const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
  }, { timestamps: true });

  module.exports = mongoose.model("Message", MessageSchema);