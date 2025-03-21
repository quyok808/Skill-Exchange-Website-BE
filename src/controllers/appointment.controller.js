const mediator = require("../mediator");
const Appointment = require("../models/appointment.model");
const catchAsync = require("../utils/catchAsync");
const CreateAppointmentRequest = require("../handlers/createAppointment/createAppointmentRequest");
const getDataFromMediator = require("../utils/promise_Mediator");
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

  const newAppointment = await getDataFromMediator(
    "createAppointmentResult",
    "createAppointmentError",
    mediator // Truyền vào đối tượng mediator.
  );

  res.status(201).json({
    status: "success",
    data: {
      appointment: newAppointment
    }
  });
});

// Lấy thông tin một lịch hẹn
exports.getAppointment = catchAsync(async (req, res, next) => {
  mediator.emit("getAppointment", { appointmentId: req.params.id });

  const appointment = await getDataFromMediator(
    "getAppointmentResult",
    "getAppointmentError",
    mediator
  );

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

// Cập nhật thông tin lịch hẹn
exports.updateAppointment = catchAsync(async (req, res, next) => {
  mediator.emit("updateAppointment", {
    appointmentId: req.params.id,
    appointmentData: req.body
  });

  const appointment = await getDataFromMediator(
    "updateAppointmentResult",
    "updateAppointmentError",
    mediator
  );

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

// Xóa lịch hẹn
exports.deleteAppointment = catchAsync(async (req, res, next) => {
  mediator.emit("deleteAppointment", { appointmentId: req.params.id });

  const haveDel = await getDataFromMediator(
    "deleteAppointmentResult",
    "deleteAppointmentError",
    mediator
  );
  if (haveDel) {
    res.status(204).json({
      status: "success",
      data: null
    });
  }
});

// Lấy danh sách lịch hẹn cho người dùng hiện tại
exports.getMyAppointments = catchAsync(async (req, res, next) => {
  mediator.emit("getMyAppointments", { userId: req.user.id });

  const appointments = await getDataFromMediator(
    "getMyAppointmentsResult",
    "getMyAppointmentsError",
    mediator
  );

  res.status(200).json({
    status: "success",
    data: {
      appointments
    }
  });
});

// Thay đổi trạng thái lịch hẹn (ví dụ: accept, reject, cancel)
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
  mediator.emit("updateAppointmentStatus", {
    status: req.body.status,
    AppointmentId: req.params.id,
    userId: req.user.id
  });

  const appointment = await getDataFromMediator(
    "updateAppointmentStatusResult",
    "updateAppointmentStatusError",
    mediator
  );

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
