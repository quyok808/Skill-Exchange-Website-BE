const http = require("http");
const socketIo = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/configs/database");
require("dotenv").config();
const logger = require("./src/utils/logger");
const ChatRoom = require("./src/models/chat.model");

// Kết nối database
connectDB();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Khi user đăng nhập, lưu socketId vào danh sách online
  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} online`);
  });

  // Xử lý tham gia phòng chat
  socket.on("joinRoom", async (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User ${socket.id} joined room ${chatRoomId}`);

    try {
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) return;
  
      // Gửi danh sách tin nhắn cũ cho user mới vào phòng
      socket.emit("loadOldMessages", chatRoom.messages);
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn cũ:", error);
    }
  });

  // Xử lý gửi tin nhắn
  socket.on("sendMessage", async ({ chatRoomId, sender, content }) => {
    try {
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) return;

      const newMessage = { sender, content, createdAt: new Date() };
      chatRoom.messages.push(newMessage);
      await chatRoom.save();

      // Gửi tin nhắn đến tất cả user trong phòng
      io.to(chatRoomId).emit("receiveMessage", newMessage);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  });

  // Khi user rời khỏi ứng dụng
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} offline`);
      }
    }
  });
});

app.set("io", io);

server.listen(5008, () => {
  console.log(`Server đang chạy trên cổng 5008`);
});
