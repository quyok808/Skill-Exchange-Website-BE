const mongoose = require("mongoose");

const ChatRoomSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("ChatRoom", ChatRoomSchema);