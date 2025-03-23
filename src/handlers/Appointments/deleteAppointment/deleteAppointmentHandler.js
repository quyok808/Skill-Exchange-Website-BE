const Appointment = require("../../../models/appointment.model");
const AppError = require("../../../utils/appError");

const DeleteAppointment = async (message) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(
      message.appointmentId
    );

    if (!appointment) {
      throw new AppError("Không tìm thấy lịch hẹn", 404);
    }
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = DeleteAppointment;
