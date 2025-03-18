const appointmentModel = require("../../models/appointment.model");

const GetMyAppointments = async (message) => {
  try {
    const appointments = await appointmentModel.find({
      $or: [{ senderId: message.userId }, { receiverId: message.userId }]
    });
    return appointments;
  } catch (error) {
    throw error;
  }
};

module.exports = GetMyAppointments;
