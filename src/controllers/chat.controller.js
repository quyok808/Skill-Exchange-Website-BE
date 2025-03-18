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
exports.sendMessage = catchAsync(async (req, res, next) => {
  const chatRoomId = req.body.chatRoomId; // Lấy chatRoomId trực tiếp từ req.body
  const senderId = req.user.id;
  let fileUrl = null;
  let imageUrl = null;
  let content = req.body.content; // Lấy content từ req.body
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return next(new AppError("Phòng chat không tồn tại!", 404));
  }

  // Nếu có file được upload
  if (req.files && req.files["file"]) {
    fileUrl = req.files["file"][0].filename;
  }

  // Nếu có ảnh được upload
  if (req.files && req.files["image"]) {
    imageUrl = req.files["image"][0].filename;
  }

  // Tạo tin nhắn mới
  const newMessage = await Message.create({
    chatRoom: chatRoomId,
    sender: senderId,
    content: content, // Nội dung tin nhắn (có thể null)
    file: fileUrl, // URL của file (có thể null)
    image: imageUrl // URL của ảnh (có thể null)
  });

  // **Quan trọng: Populate sender trước khi gửi qua Socket.IO**
  const populatedMessage = await Message.findById(newMessage._id).populate(
    "sender",
    "name email"
  );

  if (populatedMessage.image) {
    const imagePath = path.join(
      __dirname,
      "../uploads/images",
      populatedMessage.image
    ); // Đường dẫn đến file ảnh
    const imageBase64 = getBase64(imagePath);
    populatedMessage.image = `data:image/png;base64,${imageBase64}`;
  }
  if (populatedMessage.file) {
    const filePath = path.join(
      __dirname,
      "../uploads/messages",
      populatedMessage.file
    ); // Đường dẫn đến file
    const fileBase64 = getBase64(filePath);
    populatedMessage.file = `data:application/pdf;base64,${fileBase64}`;
  }

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
