const ChatRoom = require("../models/chat.model");
const Message = require("../models/message.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const path = require("path");
const fs = require("fs");

const getBase64 = (filePath) => {
  try {
    const file = fs.readFileSync(filePath);
    return file.toString("base64");
  } catch (error) {
    console.error("Lỗi khi chuyển đổi file thành base64:", error);
    console.log("Lỗi file path:", filePath);
    return null;
  }
};

// Gửi tin nhắn
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ChatRoom = require("../models/chatRoomModel"); // Giả sử bạn có model này
const Message = require("../models/messageModel"); // Giả sử bạn có model này

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { chatRoomId, content } = req.body; // Lấy chatRoomId và content từ req.body
  const senderId = req.user.id;

  // Kiểm tra phòng chat
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  // Lấy URL từ Cloudinary (nếu có) từ middleware upload
  const fileUrl = req.fileUrl || null; // Từ middleware uploadMessageFile hoặc uploadBoth
  const imageUrl = req.imageUrl || null; // Từ middleware uploadImage hoặc uploadBoth

  // Tạo tin nhắn mới
  const newMessage = await Message.create({
    chatRoom: chatRoomId,
    sender: senderId,
    content: content || null, // Nội dung tin nhắn (có thể null)
    file: fileUrl, // URL của file từ Cloudinary (có thể null)
    image: imageUrl // URL của ảnh từ Cloudinary (có thể null)
  });

  // Populate sender trước khi gửi qua Socket.IO
  const populatedMessage = await Message.findById(newMessage._id).populate(
    "sender",
    "name email"
  );

  // Gửi tin nhắn real-time qua Socket.IO
  const io = req.app.get("io");
  io.to(chatRoomId).emit("receiveMessage", populatedMessage);

  res.status(201).json({
    status: "success",
    data: { message: populatedMessage }
  });
});

// Lấy danh sách tin nhắn trong một phòng chat
exports.getMessages = catchAsync(async (req, res, next) => {
  const { chatRoomId } = req.params;

  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  let messages = await Message.find({ chatRoom: chatRoomId })
    .populate("sender", "name email")
    .sort({ createdAt: -1 })
    .limit(50);

  // Chuyển đổi imageUrl và file thành base64
  messages = messages.map((message) => {
    if (message.image) {
      const imagePath = path.join(
        __dirname,
        "../uploads/images",
        message.image
      ); // Đường dẫn đến file ảnh
      const imageBase64 = getBase64(imagePath);
      message.image = `data:image/png;base64,${imageBase64}`;
    }
    if (message.file) {
      const filePath = path.join(
        __dirname,
        "../uploads/messages",
        message.file
      ); // Đường dẫn đến file
      const fileBase64 = getBase64(filePath);
      message.file = `data:application/pdf;base64,${fileBase64}`;
    }
    return message;
  });

  res.status(200).json({
    status: "success",
    data: { messages }
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
    data: { chatRoom }
  });
});
