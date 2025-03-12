const ChatRoom = require("../models/chat.model");
const cron = require("node-cron");
const Connection = require("../models/connections.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const userModel = require("../models/user.model");
const APIFeatures = require("../utils/apiFeatures");

//Gửi yêu cầu kết nối
exports.sendRequest = catchAsync(async (req, res) => {
  const io = req.app.get("io");
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (senderId === receiverId) {
    return res.status(400).json({ message: "Không thể kết nối với chính mình!" });
  }

  // Kiểm tra đã có kết nối chưa
  const existingConnection = await Connection.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  if (existingConnection) {
    return res.status(400).json({ message: "Kết nối đã tồn tại!" });
  }

  const newConnection = await Connection.create({ senderId, receiverId, status: "pending" });

  io.to(connection.senderId.toString()).emit("newConnectionRequest", {
    senderId,
    receiverId,
    connectionId: newConnection._id,
    status: "pending",
  });

  res.status(201).json({
    status: "success",
    data: newConnection,
  });
});

//chấp nhận yêu cầu
exports.acceptRequest = catchAsync(async (req, res) => {
  const io = req.app.get("io");
  const { id } = req.params; // ID của connection
  const currentUserId = req.user.id;

  // Tìm yêu cầu kết nối theo ID
  const connection = await Connection.findById(id);
  if (!connection) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu kết nối!" });
  }

  // Kiểm tra quyền xử lý
  if (connection.receiverId.toString() !== currentUserId) {
    return res.status(403).json({ message: "Bạn không có quyền xử lý yêu cầu này!" });
  }

  // Kiểm tra xem đã chấp nhận chưa
  if (connection.status === "accepted") {
    return res.status(400).json({ message: "Kết nối này đã được chấp nhận!" });
  }

  // Tạo phòng chat
  const chatRoom = new ChatRoom({
    participants: [connection.senderId, connection.receiverId],
  });
  await chatRoom.save();

  // Cập nhật Connection với trạng thái "accepted" và lưu chatRoomId
  connection.status = "accepted";
  connection.chatRoomId = chatRoom._id;
  await connection.save();

  io.to(connection.senderId.toString()).emit("requestAccepted", {
    senderId: connection.senderId,
    receiverId: connection.receiverId,
    chatRoomId: chatRoom._id,
    status: "accepted",
  });

  res.status(200).json({
    status: "success",
    message: "Kết nối đã được chấp nhận!",
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
exports.rejectRequest = catchAsync(async (req, res) => {
  const io = req.app.get("io");
  const { id } = req.params;
  const currentUserId = req.user.id;

  const connection = await Connection.findById(id);
  if (!connection) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu kết nối!" });
  }

  if (connection.receiverId.toString() !== currentUserId) {
    return res.status(403).json({ message: "Bạn không có quyền xử lý yêu cầu này!" });
  }

  await Connection.findByIdAndDelete(id);

  io.to(connection.senderId.toString()).emit("requestRejected", {
    senderId: connection.senderId,
    receiverId: connection.receiverId,
    status: "none",
  });

  res.status(200).json({
    status: "success",
    message: "Yêu cầu kết nối đã bị từ chối!",
  });
});

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
    .populate("senderId", "name email skills address phone")
    .populate("receiverId", "name email skills address phone");
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

exports.getAcceptedRequests = catchAsync(async (req, res) => {
  const pendingRequests = await Connection.find({
    $and: [
      { $or: [{ receiverId: req.user.id }, { senderId: req.user.id }] },
      { status: "accepted" },
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

exports.getUsersInNetwork = catchAsync(async (req, res) => {
  let findConditions = {};
  const currentUserId = req.user.id;
  // Nếu có skillName, tìm các skill khớp trước
  if (query.skillName) {
    const skillIds = await Skill.find({
      name: { $regex: query.skillName, $options: "i" },
    }).distinct("_id"); // Lấy danh sách ObjectId của skills khớp
    if (skillIds.length == 0) {
      throw new AppError("Không có thông tin kỹ năng", 404);
    }
    if (skillIds.length > 0) {
      findConditions.skills = { $in: skillIds }; // Lọc user có skills trong danh sách
    } else {
      return { users: [], features: null, totalUsers: 0, totalPages: 0 }; // Không tìm thấy skill nào khớp
    }
  }

  // Loại trừ user đang đăng nhập
  if (currentUserId) {
    findConditions._id = { $ne: currentUserId }; // Thêm điều kiện để loại trừ user hiện tại
  }

  const features = new APIFeatures(
    userModel.find().populate("skills"),
    req.query
  )
    .filter()
    .sort()
    .paginate();

  const users = await features.query;

  // const totalUsers = await User.countDocuments();
  const totalUsers = await userModel.countDocuments(features.mongoQuery); // Đếm số lượng user sau khi filter
  const totalPages = Math.ceil(totalUsers / features.limit);
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
      page: features.page,
      limit: features.limit,
      totalPages,
      totalUsers,
    },
  });
});


// Kiểm tra trạng thái kết nối
exports.getConnectionStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const connection = await Connection.findOne({
    $or: [
      { senderId: currentUserId, receiverId: userId },
      { senderId: userId, receiverId: currentUserId },
    ],
  });

  if (!connection) {
    return res.status(200).json({ status: "none" });
  }

  return res.status(200).json({
    connectionId: connection._id,
    status: connection.status,
    received: connection.receiverId.toString() === currentUserId, // Xác định user có nhận request không
  });
});

// Hủy yêu cầu kết nối
exports.cancelRequest = catchAsync(async (req, res) => {
  const { receiverId } = req.params;
  const senderId = req.user.id;

  const connection = await Connection.findOneAndDelete({
    senderId,
    receiverId,
    status: "pending",
  });

  if (!connection) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu kết nối đang chờ!" });
  }

  res.status(200).json({
    status: "success",
    message: "Đã hủy yêu cầu kết nối!",
  });
});
