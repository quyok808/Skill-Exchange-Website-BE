const ChatRoom = require("../models/chat.model");
const cron = require("node-cron");
const Connection = require("../models/connections.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

//Gửi yêu cầu kết nối
exports.sendRequest = catchAsync(async (req, res) => {
  const { receiverId, skill } = req.body;
  const senderId = req.user.id;

  if (senderId === receiverId) {
    return new AppError("Không thể kết nối với chính mình!", 400);
  }

  const existingRequest = await Connection.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  if (existingRequest && existingRequest.status === "pending") {
    return new AppError("Bạn đã có kết nối!", 400);
  }

  if (existingRequest && existingRequest.status === "rejected") {
    await Connection.findByIdAndDelete(existingRequest._id); // Xóa yêu cầu cũ
  }

  const newConnection = new Connection({
    senderId,
    receiverId,
    skill,
    status: "pending",
  });
  await newConnection.save();
  res.status(201).json({
    status: "success",
    data: {
      newConnection,
    },
  });
});

//chấp nhận yêu cầu
exports.acceptRequest = catchAsync(async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return new AppError("Không tìm thấy yêu cầu!", 404);
  }

  if (connection.receiverId.toString() !== req.user.id) {
    return new AppError("Không có quyền xử lý yêu cầu này!", 403);
  }

  if (connection.status === "accepted") {
    return new AppError("Kết nối này đã được chấp nhận trước đó!", 400);
  }

  // Tạo phòng chat
  const chatRoom = new ChatRoom({
    participants: [connection.senderId, connection.receiverId],
  });
  await chatRoom.save();

  // Cập nhật Connection với chatRoomId
  connection.status = "accepted";
  connection.chatRoomId = chatRoom._id;
  await connection.save();

  const chat = await chatRoom.populate("participants", "_id name email");
  res.status(200).json({
    status: "success",
    data: {
      chat,
    },
  });
});

//hủy kết nối
exports.disconnect = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user.id;
  const connection = await Connection.findOne({
    $or: [
      { senderId: currentUserId, receiverId: userId },
      { senderId: userId, receiverId: currentUserId },
    ],
    status: "accepted", // Chỉ hủy nếu đã kết nối
  });

  if (!connection) {
    return new AppError("Không tìm thấy yêu cầu kết nối!", 404);
  }

  await ChatRoom.findByIdAndDelete(connection.chatRoomId);

  await Connection.findByIdAndDelete(connection._id);

  res.status(200).json({
    status: "success",
    data: {
      message: "Yêu cầu kết nối đã bị hủy!",
    },
  });
});

//từ chối yêu cầu
exports.rejectRequest = async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return new AppError("Không tìm thấy yêu cầu kết nối!", 404);
  }

  if (connection.receiverId.toString() !== req.user.id) {
    return new AppError("Không có quyền xử lý yêu cầu này!", 403);
  }

  connection.status = "rejected";
  connection.rejectedAt = new Date();
  await connection.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "Yêu cầu kết nối bị từ chối! Sẽ tự động xóa sau 24h.",
      connection,
    },
  });
};

//Kiểm tra và xóa yêu cầu từ chối quá 24h...
cron.schedule(
  "0 * * * *",
  catchAsync(async () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const result = await Connection.deleteMany({
      status: "rejected",
      rejectedAt: { $lte: twentyFourHoursAgo },
    });
    console.log(
      `Đã xóa ${result.deletedCount} yêu cầu kết nối bị từ chối quá 24h.`
    );
  })
);

// Lấy danh sách yêu cầu kết nối đang chờ xử lý
exports.getAllrequests = catchAsync(async (req, res) => {
  const pendingRequests = await Connection.find({
    $or: [{ receiverId: req.user.id }, { senderId: req.user.id }],
  })
    .populate("senderId", "name email")
    .populate("receiverId", "name email");
  res.status(200).json({
    status: "success",
    data: {
      pendingRequests,
    },
  });
});

exports.getPendingrequests = catchAsync(async (req, res) => {
  const pendingRequests = await Connection.find({
    $and: [
      { $or: [{ receiverId: req.user.id }, { senderId: req.user.id }] },
      { status: "pending" },
    ],
  })
    .populate("senderId", "name email")
    .populate("receiverId", "name email");
  res.status(200).json({
    status: "success",
    data: {
      pendingRequests,
    },
  });
});
