const express = require("express");
const {
  sendMessage,
  getMessages,
  getChatRoom
} = require("../controllers/chat.controller");
const { protect } = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/send", protect, uploadMiddleware.uploadBoth, sendMessage); // Gửi tin nhắn
router.get("/:chatRoomId/messages", protect, getMessages); // Lấy tin nhắn của một phòng
router.get("/:chatRoomId", protect, getChatRoom);
module.exports = router;
