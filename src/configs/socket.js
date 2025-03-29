const socketIo = require("socket.io");
const ChatRoom = require("../models/chat.model");
const Message = require("../models/message.model");
const onlineUsers = new Map();

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Khi user đăng nhập, lưu socketId vào danh sách online
    socket.on("userOnline", (userId) => {
      if (!userId) return;
      // Nếu userId chưa có, tạo Set mới; nếu có, thêm socket.id vào Set
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      console.log(`User ${userId} online với socketId ${socket.id}`);
      io.emit("onlineStatusUpdate", { userId, status: "online" });
    });

    socket.on("checkUserStatus", (userId) => {
      const isOnline =
        onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
      socket.emit("userStatusResponse", {
        userId,
        status: isOnline ? "online" : "offline"
      });
    });

    // Xử lý tham gia phòng chat
    socket.on("joinRoom", async (chatRoomId) => {
      try {
        socket.join(chatRoomId);
        console.log(`User ${socket.id} joined room ${chatRoomId}`);
      } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
      }
    });

    // Xử lý gửi tin nhắn
    socket.on("sendMessage", async ({ chatRoomId, sender, content }) => {
      try {
        const newMessage = await Message.create({
          chatRoom: chatRoomId,
          sender,
          content
        });

        const populatedMessage = await Message.findById(
          newMessage._id
        ).populate("sender", "name email");

        // Gửi tin nhắn đến tất cả user trong phòng
        socket.to(chatRoomId).emit("receiveMessage", populatedMessage);
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        socket.emit("sendMessageError", "Không thể gửi tin nhắn.");
      }
    });

    // Xử lý gọi video
    socket.on("callUser", ({ to, offer }) => {
      io.to([...(onlineUsers.get(to) || [])]).emit("incomingCall", {
        from: socket.id,
        offer
      });
    });

    socket.on("answerCall", ({ to, answer }) => {
      io.to([...(onlineUsers.get(to) || [])]).emit("callAnswered", { answer });
    });

    // Thêm xử lý updateOffer khi có track mới (ví dụ: chia sẻ màn hình)
    socket.on("updateOffer", ({ to, offer }) => {
      const targetSocketIds = onlineUsers.get(to) || [];
      io.to([...targetSocketIds]).emit("updateOffer", {
        from: socket.id,
        offer
      });
      console.log(`Update offer sent to user ${to} from ${socket.id}`);
    });

    socket.on("updateAnswer", ({ to, answer }) => {
      const targetSocketIds = onlineUsers.get(to) || [];
      io.to([...targetSocketIds]).emit("updateAnswer", { answer });
      console.log(`Update answer sent to user ${to}`);
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
      io.to([...(onlineUsers.get(to) || [])]).emit("iceCandidate", {
        candidate
      });
    });

    socket.on("endCall", ({ to }) => {
      io.to([...(onlineUsers.get(to) || [])]).emit("callEnded");
    });

    // Thêm xử lý dừng chia sẻ màn hình
    socket.on("screenShareEnded", ({ to }) => {
      const targetSocketIds = onlineUsers.get(to) || [];
      io.to([...targetSocketIds]).emit("screenShareEnded");
      console.log(`Screen share ended sent to user ${to} from ${socket.id}`);
    });

    socket.on("send-notify-book-appointment", async (receiverId) => {
      const receiverSocketIds = onlineUsers.get(receiverId);
      if (receiverSocketIds) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("receive-notify-book-appointment", {
            message: "Bạn có một lịch hẹn mới!"
          });
        });
      }
    });

    socket.on("disconnect", () => {
      for (let [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            onlineUsers.delete(userId);
            //console.log(`User ${userId} offline`);
            io.emit("onlineStatusUpdate", { userId, status: "offline" });
          }
        }
      }
    });
  });

  // Đặt io vào app để có thể sử dụng trong các API controllers
  require("../app").set("io", io);
}

module.exports = { initializeSocket };
