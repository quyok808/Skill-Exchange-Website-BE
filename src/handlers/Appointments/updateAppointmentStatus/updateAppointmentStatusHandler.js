const appointmentModel = require("../../../models/appointment.model");
const AppError = require("../../../utils/appError");

const UpdateAppointmentStatus = async (message) => {
  try {
    const appointment = await appointmentModel.findById(message.AppointmentId);
    if (!appointment) {
      throw new AppError("Không tìm thấy thông tin lịch hẹn", 404);
    }

    // Authorization: Chỉ receiver mới có quyền accept/reject
    if (message.status === "accepted" || message.status === "rejected") {
      if (appointment.receiverId.toString() !== message.userId) {
        throw new AppError("Bạn không được phép thực hiện hành động này", 403);
      }
    }

    // Authorization: Cả sender và receiver đều có quyền cancel
    if (message.status === "canceled") {
      if (
        appointment.senderId.toString() !== message.userId &&
        appointment.receiverId.toString() !== message.userId
      ) {
        throw new AppError("Bạn không được phép thực hiện hành động này", 403);
      }
    }

    appointment.status = message.status;
    await appointment.save();
    return appointment;
  } catch (error) {
    throw error;
  }
};

module.exports = UpdateAppointmentStatus;
