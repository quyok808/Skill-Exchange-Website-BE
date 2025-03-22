const appointmentModel = require("../../../models/appointment.model");

const GetAppointmentHandler = async (message) => {
  try {
    const appointment = await appointmentModel.findById(message.appointmentId);

    if (!appointment) {
      throw new AppError("Không tìm thấy lịch hẹn", 404);
    }

    return appointment;
  } catch (error) {
    throw error;
  }
};

module.exports = GetAppointmentHandler;
