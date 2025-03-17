const Appointment = require("../../models/appointment.model");

const CreateAppointmentHandler = async (message) => {
  try {
    // Validate inputs (Moved to the top for clarity)
    if (
      !message.receiverId ||
      !message.startTime ||
      !message.endTime ||
      !message.description
    ) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400);
    }

    if (message.senderId === message.receiverId) {
      throw new AppError("Không thể tự lên lịch học với chính mình", 400);
    }

    //Kiểm tra xem thời gian hẹn có hợp lệ không
    if (message.startTime >= message.endTime) {
      throw new AppError(
        "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
        400
      );
    }

    // Convert startTime and endTime to Date objects for accurate comparison
    const start = new Date(message.startTime);
    const end = new Date(message.endTime);

    //Check for overlapping appointments
    const overlappingAppointment = await Appointment.findOne({
      $or: [
        {
          $and: [
            { startTime: { $lt: end } },
            { endTime: { $gt: start } },
            { $or: [{ status: "accepted" }, { status: "pending" }] },
            {
              $or: [
                { senderId: message.senderId },
                { receiverId: message.senderId }
              ]
            }, // Either sender or receiver is the current user
            {
              $or: [
                { senderId: message.receiverId },
                { receiverId: message.receiverId }
              ]
            } // Either sender or receiver is the other user
          ]
        }
      ]
    });

    if (overlappingAppointment) {
      return next(
        new AppError(
          "Thời gian này tớ đang bận, vui lòng chọn thời gian khác nhé!",
          409
        )
      );
    }

    const newAppointment = await Appointment.create(
      message.senderId,
      message.receiverId,
      (message.startTime = start), // Store as Date objects
      (message.endTime = end), // Store as Date objects
      message.description
    );
    return newAppointment;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

module.exports = CreateAppointmentHandler;
