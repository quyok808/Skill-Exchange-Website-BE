const ChatRoom = require("../models/chat.model");
const Message = require("../models/message.model");
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

  // Tạo tin nhắn mới
  const newMessage = await Message.create({
    chatRoom: chatRoomId,
    sender: senderId,
    content,
  });

  // **Quan trọng: Populate sender trước khi gửi qua Socket.IO**
  const populatedMessage = await Message.findById(newMessage._id).populate(
    "sender",
    "name email"
  );

  // Gửi tin nhắn real-time qua Socket.IO
  const io = req.app.get("io"); // Lấy instance của Socket.IO từ `server.js`
  io.to(chatRoomId).emit("receiveMessage", populatedMessage); // Gửi populatedMessage

  res.status(201).json({
    status: "success",
    data: { message: populatedMessage }, // Gửi populatedMessage trong response
  });
});

// Lấy danh sách tin nhắn trong một phòng chat
exports.getMessages = catchAsync(async (req, res, next) => {
  const { chatRoomId } = req.params;

  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  const messages = await Message.find({ chatRoom: chatRoomId })
    .populate("sender", "name email")
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    status: "success",
    data: { messages },
  });
});

exports.getChatRoom = catchAsync(async (req, res, next) => {
  const { chatRoomId } = req.params;
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }
  res.status(200).json({
    status: "success",
    data: { chatRoom },
  });
});