const mediator = require("../mediator");
const Appointment = require("../models/appointment.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const CreateAppointmentRequest = require("../handlers/createAppointment/createAppointmentRequest");
const cron = require("node-cron");

// Tạo lịch hẹn mới
exports.createAppointment = catchAsync(async (req, res, next) => {
  const { receiverId, startTime, endTime, description } = req.body;
  const senderId = req.user.id;

  const createAppointmentRequest = new CreateAppointmentRequest(
    senderId,
    receiverId,
    startTime,
    endTime,
    description
  );

  // "Unpackage" dữ liệu từ request object và truyền vào emit
  mediator.emit("createAppointment", {
    senderId: createAppointmentRequest.senderId,
    receiverId: createAppointmentRequest.receiverId,
    startTime: createAppointmentRequest.startTime,
    endTime: createAppointmentRequest.endTime,
    description: createAppointmentRequest.description
  });

  const createAppointmentPromise = new Promise((resolve, reject) => {
    mediator.once("createAppointmentResult", (result) => {
      resolve(result);
    });
    mediator.once("createAppointmentError", (error) => {
      reject(error);
    });
  });

  const newAppointment = await createAppointmentPromise;
  res.status(201).json({
    status: "success",
    data: {
      appointment: newAppointment
    }
  });
});

// Lấy thông tin một lịch hẹn
exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

// Cập nhật thông tin lịch hẹn
exports.updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

// Xóa lịch hẹn
exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

// Lấy danh sách lịch hẹn cho người dùng hiện tại
exports.getMyAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.find({
    $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
  });

  res.status(200).json({
    status: "success",
    data: {
      appointments
    }
  });
});

// Thay đổi trạng thái lịch hẹn (ví dụ: accept, reject, cancel)
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // Authorization: Chỉ receiver mới có quyền accept/reject
  if (status === "accepted" || status === "rejected") {
    if (appointment.receiverId.toString() !== req.user.id) {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }
  }

  // Authorization: Cả sender và receiver đều có quyền cancel
  if (status === "canceled") {
    if (
      appointment.senderId.toString() !== req.user.id &&
      appointment.receiverId.toString() !== req.user.id
    ) {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

// Gửi email nhắc nhở 1 giờ trước khi lịch hẹn bắt đầu
cron.schedule("0 * * * *", async () => {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ sau

  const appointments = await Appointment.find({
    startTime: { $gte: now, $lte: reminderTime },
    status: "pending" // Chỉ gửi nhắc nhở cho các lịch hẹn chưa được chấp nhận/từ chối
  }).populate("senderId receiverId", "name email");

  appointments.forEach(async (appointment) => {
    try {
      await sendEmail({
        email: appointment.senderId.email,
        subject: "Reminder: Your upcoming appointment",
        message: `Your appointment with ${appointment.receiverId.name} is scheduled for ${appointment.startTime}.`
      });

      await sendEmail({
        email: appointment.receiverId.email,
        subject:
          "Reminder: Upcoming appointment with ${appointment.senderId.name}",
        message: `You have an appointment with ${appointment.senderId.name} scheduled for ${appointment.startTime}.`
      });
      appointment.status = "reminded";
      await appointment.save();
    } catch (error) {
      console.error("Không gửi được mail", error);
    }
  });
  console.log("Đã gửi thông báo");
});
