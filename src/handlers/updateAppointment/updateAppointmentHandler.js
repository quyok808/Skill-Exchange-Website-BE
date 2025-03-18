const appointmentModel = require("../../models/appointment.model");

const UpdateAppointment = async (message) => {
  try {
    const appointment = await appointmentModel.findByIdAndUpdate(
      message.appointmentId,
      message.appointmentData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!appointment) {
      throw new AppError("Không tìm thấy thông tin lịch hẹn", 404);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = UpdateAppointment;
