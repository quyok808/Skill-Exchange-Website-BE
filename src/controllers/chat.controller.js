const ChatRoom = require("../models/chat.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Gửi tin nhắn
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { chatRoomId, content } = req.body;
  const senderId = req.user.id;

  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  const newMessage = { sender: senderId, content, createdAt: new Date() };
  chatRoom.messages.push(newMessage);
  await chatRoom.save();

  // Gửi tin nhắn real-time qua Socket.IO
  const io = req.app.get("io"); // Lấy instance của Socket.IO từ `server.js`
  io.to(chatRoomId).emit("receiveMessage", newMessage);

  res.status(201).json({
    status: "success",
    data: { message: newMessage },
  });
});

// Lấy danh sách tin nhắn trong một phòng chat
// exports.getMessages = catchAsync(async (req, res, next) => {
//   const { chatRoomId } = req.params;
//   const chatRoom = await ChatRoom.findById(chatRoomId).populate("messages.sender", "name email");

//   if (!chatRoom) {
//     return next(new AppError("Phòng chat không tồn tại!", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: { messages: chatRoom.messages },
//   });
// });

exports.getMessages = catchAsync(async (req, res, next) => {
  const { chatRoomId } = req.params;

  console.log("🔍 Debug: chatRoomId từ request:", chatRoomId); // ✅ Debug ID

  const chatRoom = await ChatRoom.findById(chatRoomId).populate("messages.sender", "name email");

  if (!chatRoom) {
    console.log("🚨 Không tìm thấy phòng chat!");
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  console.log("✅ Đã tìm thấy phòng chat:", chatRoom);

  res.status(200).json({
    status: "success",
    data: { messages: chatRoom.messages },
  });
});